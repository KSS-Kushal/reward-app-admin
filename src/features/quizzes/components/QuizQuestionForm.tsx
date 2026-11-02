import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useForm, useWatch, type FieldError } from 'react-hook-form'
import { SelectField, SwitchField, TextareaField, TextField } from '@/components/form/fields'
import { FormActions } from '@/components/form/FormActions'
import { UnsavedChangesGuard } from '@/components/form/UnsavedChangesGuard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageField } from '@/features/media/components/ImageField'
import { applyServerErrors } from '@/lib/forms'
import { cn } from '@/lib/utils'
import {
  MAX_ANSWERS,
  MAX_OPTIONS,
  MIN_OPTIONS,
  questionToForm,
  quizQuestionSchema,
  type QuizQuestionFormValues,
} from '../schemas/quiz-question.schema'
import {
  ANSWER_TYPE_LABELS,
  EDITABLE_QUIZ_TYPES,
  QUIZ_TYPE_LABELS,
  type AnswerType,
  type EditableQuizType,
  type QuizQuestion,
} from '../types/quiz.types'

const QUIZ_TYPE_OPTIONS = EDITABLE_QUIZ_TYPES.map((type) => ({ value: type, label: QUIZ_TYPE_LABELS[type] }))

/** Array-level errors live on `.message` (resolver) or `.root.message` (setError). */
function arrayError(error: unknown): string | undefined {
  const value = error as (FieldError & { root?: FieldError }) | undefined
  return value?.message ?? value?.root?.message
}

interface QuizQuestionFormProps {
  question?: QuizQuestion
  defaultType?: EditableQuizType
  onSubmit: (values: QuizQuestionFormValues) => Promise<unknown>
  onCancel: () => void
  pending: boolean
}

export function QuizQuestionForm({
  question,
  defaultType,
  onSubmit,
  onCancel,
  pending,
}: QuizQuestionFormProps) {
  const isCreate = !question
  const form = useForm<QuizQuestionFormValues>({
    resolver: zodResolver(quizQuestionSchema),
    defaultValues: questionToForm(question, defaultType),
  })
  const options = useFieldArray({ control: form.control, name: 'options' })
  const answers = useFieldArray({ control: form.control, name: 'acceptedAnswers' })
  const [answerType, correctIndex] = useWatch({ control: form.control, name: ['answerType', 'correctIndex'] })
  const errors = form.formState.errors

  const removeOption = (index: number) => {
    options.remove(index)
    if (correctIndex === index) form.setValue('correctIndex', null, { shouldDirty: true })
    else if (correctIndex !== null && correctIndex > index)
      form.setValue('correctIndex', correctIndex - 1, { shouldDirty: true })
  }

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      applyServerErrors(form, error)
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-6" noValidate>
        <UnsavedChangesGuard when={form.formState.isDirty && !form.formState.isSubmitting} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <CardHeader>
              <CardTitle>Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <TextareaField
                control={form.control}
                name="text"
                label="Question"
                required
                rows={3}
                maxLength={500}
                showCount
                placeholder="What is the capital of Australia?"
              />

              <div className="space-y-2">
                <Label id="answer-type-label">Answer type</Label>
                <Tabs
                  value={answerType}
                  onValueChange={(value) =>
                    form.setValue('answerType', value as AnswerType, { shouldDirty: true })
                  }
                >
                  <TabsList aria-labelledby="answer-type-label">
                    <TabsTrigger value="singleChoice">{ANSWER_TYPE_LABELS.singleChoice}</TabsTrigger>
                    <TabsTrigger value="text">{ANSWER_TYPE_LABELS.text}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {answerType === 'singleChoice' ? (
                <fieldset className="space-y-3">
                  <legend className="mb-1 text-sm font-medium">
                    Options{' '}
                    <span className="font-normal text-muted-foreground">— select the correct one</span>
                  </legend>
                  <RadioGroup
                    value={correctIndex === null ? '' : String(correctIndex)}
                    onValueChange={(value) =>
                      form.setValue('correctIndex', Number(value), {
                        shouldDirty: true,
                        shouldValidate: form.formState.isSubmitted,
                      })
                    }
                    className="gap-2"
                    aria-label="Correct option"
                  >
                    {options.fields.map((field, index) => (
                      <div
                        key={field.id}
                        className={cn(
                          'flex items-start gap-3 rounded-lg border p-2 pl-3 transition-colors',
                          correctIndex === index && 'border-success/50 bg-success/5',
                        )}
                      >
                        <RadioGroupItem
                          value={String(index)}
                          id={`option-correct-${index}`}
                          className="mt-2.5"
                          aria-label={`Option ${index + 1} is correct`}
                        />
                        <FormField
                          control={form.control}
                          name={`options.${index}.text`}
                          render={({ field: input }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="sr-only">Option {index + 1}</FormLabel>
                              <FormControl>
                                <Input {...input} placeholder={`Option ${index + 1}`} maxLength={255} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                          disabled={options.fields.length <= MIN_OPTIONS}
                          aria-label={`Delete option ${index + 1}`}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    ))}
                  </RadioGroup>
                  {(arrayError(errors.options) || errors.correctIndex) && (
                    <p role="alert" className="text-sm text-destructive">
                      {arrayError(errors.options) ?? errors.correctIndex?.message}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => options.append({ text: '' })}
                    disabled={options.fields.length >= MAX_OPTIONS}
                  >
                    <Plus /> Add option
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {MIN_OPTIONS}–{MAX_OPTIONS} options, exactly one correct.
                  </p>
                </fieldset>
              ) : (
                <fieldset className="space-y-3">
                  <legend className="mb-1 text-sm font-medium">Accepted answers</legend>
                  {answers.fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2">
                      <FormField
                        control={form.control}
                        name={`acceptedAnswers.${index}.value`}
                        render={({ field: input }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="sr-only">Accepted answer {index + 1}</FormLabel>
                            <FormControl>
                              <Input {...input} placeholder="e.g. Au" maxLength={200} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => answers.remove(index)}
                        disabled={answers.fields.length <= 1}
                        aria-label={`Delete answer ${index + 1}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                  {arrayError(errors.acceptedAnswers) && (
                    <p role="alert" className="text-sm text-destructive">
                      {arrayError(errors.acceptedAnswers)}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => answers.append({ value: '' })}
                    disabled={answers.fields.length >= MAX_ANSWERS}
                  >
                    <Plus /> Add answer
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    1–{MAX_ANSWERS} answers. Matched case-insensitively; add spelling variants users might
                    type.
                  </p>
                </fieldset>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                  Math questions are generated automatically and can't be added here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SelectField
                  control={form.control}
                  name="quizType"
                  label="Quiz"
                  options={QUIZ_TYPE_OPTIONS}
                  required
                />
                <SwitchField
                  control={form.control}
                  name="active"
                  label="Active"
                  description="Inactive questions are never asked."
                />
                {isCreate && (
                  <TextField
                    control={form.control}
                    name="id"
                    label="ID"
                    placeholder="q_101"
                    inputClassName="font-mono"
                    description="Optional. Generated when empty."
                  />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Image</CardTitle>
                <CardDescription>Optional picture shown with the question.</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageField control={form.control} name="imageUrl" label="Image" folder="quiz" />
              </CardContent>
            </Card>
          </div>
        </div>
        <FormActions
          submitLabel={isCreate ? 'Create question' : 'Save changes'}
          pending={pending}
          onCancel={onCancel}
          sticky
        />
      </form>
    </Form>
  )
}

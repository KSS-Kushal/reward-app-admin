import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router'
import { EntitySelect } from '@/components/common/EntitySelect'
import { DateTimeField, NumberField, SelectField, TextareaField, TextField } from '@/components/form/fields'
import { FormActions } from '@/components/form/FormActions'
import { UnsavedChangesGuard } from '@/components/form/UnsavedChangesGuard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useArticleCategories } from '@/features/article-categories/api/hooks'
import { ImageField } from '@/features/media/components/ImageField'
import { applyServerErrors } from '@/lib/forms'
import {
  articleSchema,
  articleToForm,
  CONTENT_MAX,
  countWords,
  splitParagraphs,
  type ArticleFormValues,
} from '../schemas/article.schema'
import { ARTICLE_STATUS_LABELS, ARTICLE_STATUSES, type Article } from '../types/article.types'

const STATUS_OPTIONS = ARTICLE_STATUSES.map((status) => ({
  value: status,
  label: ARTICLE_STATUS_LABELS[status],
}))

interface ArticleFormProps {
  article?: Article
  onSubmit: (values: ArticleFormValues) => Promise<unknown>
  onCancel: () => void
  pending: boolean
}

/** Renders plain-text paragraphs exactly as stored; no HTML is interpreted. */
function ArticlePreview({ title, summary, content }: { title: string; summary: string; content: string }) {
  const paragraphs = splitParagraphs(content)
  return (
    <article className="max-w-prose space-y-4 rounded-md border bg-background p-5">
      <h2 className="text-xl font-semibold">{title || 'Untitled article'}</h2>
      {summary && <p className="text-muted-foreground">{summary}</p>}
      {paragraphs.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Nothing to preview yet.</p>
      ) : (
        paragraphs.map((paragraph, index) => (
          <p key={index} className="leading-relaxed whitespace-pre-line">
            {paragraph}
          </p>
        ))
      )}
    </article>
  )
}

export function ArticleForm({ article, onSubmit, onCancel, pending }: ArticleFormProps) {
  const isCreate = !article
  const categories = useArticleCategories()
  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: articleToForm(article),
  })
  const [title, summary, content] = useWatch({ control: form.control, name: ['title', 'summary', 'content'] })
  const words = countWords(content)
  const paragraphs = splitParagraphs(content).length
  const estimatedMinutes = Math.max(1, Math.round(words / 200))

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
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card>
            <CardHeader>
              <CardTitle>Article</CardTitle>
              <CardDescription>Plain text. Separate paragraphs with a blank line.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextField
                control={form.control}
                name="title"
                label="Title"
                required
                maxLength={200}
                placeholder="5 simple habits to save money every month"
              />
              <TextareaField
                control={form.control}
                name="summary"
                label="Summary"
                required
                rows={2}
                maxLength={500}
                showCount
                description="Shown in article lists."
              />
              <Tabs defaultValue="write">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <TabsList>
                    <TabsTrigger value="write">Write</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
                    {words.toLocaleString()} words · {paragraphs}{' '}
                    {paragraphs === 1 ? 'paragraph' : 'paragraphs'} · ~{estimatedMinutes} min read
                  </p>
                </div>
                <TabsContent value="write">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Content</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={18}
                            className="min-h-80 font-serif text-base leading-relaxed"
                            placeholder={'First paragraph…\n\nSecond paragraph…'}
                          />
                        </FormControl>
                        <FormDescription>
                          {content.length.toLocaleString()}/{CONTENT_MAX.toLocaleString()} characters. Extra
                          blank lines are tidied up on save.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="preview">
                  <ArticlePreview title={title} summary={summary} content={content} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SelectField
                  control={form.control}
                  name="status"
                  label="Status"
                  options={STATUS_OPTIONS}
                  required
                  description="Only published articles appear in the app."
                />
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>
                        Category
                        <span className="text-destructive" aria-hidden>
                          *
                        </span>
                      </FormLabel>
                      <FormControl>
                        <EntitySelect
                          items={categories.data}
                          isLoading={categories.isLoading}
                          value={field.value}
                          onChange={(value) => field.onChange(value ?? '')}
                          getValue={(category) => category.id}
                          getLabel={(category) => category.name}
                          placeholder="Choose a category"
                          aria-invalid={Boolean(fieldState.error)}
                        />
                      </FormControl>
                      {categories.data?.length === 0 && (
                        <FormDescription>
                          No categories yet.{' '}
                          <Link to="/admin/article-categories" className="text-primary underline">
                            Create one first.
                          </Link>
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <TextField
                  control={form.control}
                  name="author"
                  label="Author"
                  maxLength={120}
                  placeholder="Kavodnik Team"
                  description="Defaults to Kavodnik Team."
                />
                <DateTimeField
                  control={form.control}
                  name="publishedAt"
                  label="Published at"
                  placeholder="Now (on save)"
                />
                {isCreate && (
                  <TextField
                    control={form.control}
                    name="id"
                    label="ID"
                    placeholder="article_sip"
                    inputClassName="font-mono"
                    description="Optional. Used in /articles/<id> links."
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Read & Earn</CardTitle>
                <CardDescription>Coins paid when a user finishes reading.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <NumberField
                  control={form.control}
                  name="rewardCoins"
                  label="Reward"
                  min={0}
                  suffix="coins"
                  description="0 means no reward."
                />
                <NumberField
                  control={form.control}
                  name="requiredReadSeconds"
                  label="Required reading time"
                  min={0}
                  suffix="sec"
                  description="How long the article must stay open before the reward can be claimed."
                />
                <NumberField
                  control={form.control}
                  name="readTimeMinutes"
                  label="Read time"
                  min={1}
                  suffix="min"
                  placeholder={`~${estimatedMinutes}`}
                  description="Leave empty to estimate from the content."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cover image</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageField
                  control={form.control}
                  name="imageUrl"
                  label="Image"
                  folder="articles"
                  aspect="wide"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <FormActions
          submitLabel={isCreate ? 'Create article' : 'Save changes'}
          pending={pending}
          onCancel={onCancel}
          sticky
        />
      </form>
    </Form>
  )
}

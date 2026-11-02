import { describe, expect, it } from 'vitest'
import {
  articleSchema,
  articleToForm,
  formToArticleRequest,
  normalizeContent,
} from '@/features/articles/schemas/article.schema'
import { bannerSchema, bannerToForm, formToBannerRequest } from '@/features/banners/schemas/banner.schema'
import { checkInToValue, spinWheelForm } from '@/features/configuration/schemas/config.schemas'
import { merchantSchema, merchantToForm } from '@/features/merchants/schemas/merchant.schema'
import { emptyProduct, formToProductRequest, productSchema } from '@/features/products/schemas/product.schema'
import { parseSpreadsheet } from '@/features/products/utils/parse-spreadsheet'
import {
  formToQuestionRequest,
  questionToForm,
  quizQuestionSchema,
} from '@/features/quizzes/schemas/quiz-question.schema'

const messages = (result: {
  success: boolean
  error?: { issues: { path: PropertyKey[]; message: string }[] }
}) => Object.fromEntries((result.error?.issues ?? []).map((issue) => [issue.path.join('.'), issue.message]))

describe('banner schema', () => {
  it('requires endsAt after startsAt and #RRGGBB gradients', () => {
    const values = {
      ...bannerToForm(),
      title: 'Diwali',
      startsAt: '2026-11-05T00:00:00Z',
      endsAt: '2026-11-01T00:00:00Z',
      gradientStart: 'red',
    }
    const errors = messages(bannerSchema.safeParse(values))
    expect(errors.endsAt).toMatch(/after the start/)
    expect(errors.gradientStart).toMatch(/#RRGGBB/)
  })

  it('rejects unknown app routes and builds the API body', () => {
    expect(
      messages(bannerSchema.safeParse({ ...bannerToForm(), title: 'x', actionRoute: '/nope' })).actionRoute,
    ).toBeDefined()
    const body = formToBannerRequest(
      { ...bannerToForm(), title: ' Spin ', actionRoute: '/spin-wheel', id: 'banner_spin' },
      true,
    )
    expect(body).toMatchObject({
      id: 'banner_spin',
      title: 'Spin',
      actionRoute: '/spin-wheel',
      gradient: ['#EDE9FE', '#C9BCF7'],
      tag: null,
    })
    // id is never sent on update
    expect(
      formToBannerRequest({ ...bannerToForm(), title: 'x', id: 'banner_spin' }, false),
    ).not.toHaveProperty('id')
  })
})

describe('article schema', () => {
  it('requires title, summary, content and category', () => {
    const errors = messages(articleSchema.safeParse(articleToForm()))
    expect(Object.keys(errors)).toEqual(expect.arrayContaining(['title', 'summary', 'content', 'categoryId']))
  })

  it('normalizes paragraphs to blank-line separation and sends nulls for defaults', () => {
    expect(normalizeContent('One.\r\n\r\n\r\n  Two.  \n\nThree.')).toBe('One.\n\nTwo.\n\nThree.')
    const body = formToArticleRequest(
      { ...articleToForm(), title: 'T', summary: 'S', content: 'A\n\n\nB', categoryId: 'finance' },
      true,
    )
    expect(body).toMatchObject({ content: 'A\n\nB', author: null, status: 'DRAFT', rewardCoins: 0 })
  })
})

describe('quiz question schema', () => {
  it('requires exactly one correct option among 2–6', () => {
    const base = questionToForm()
    expect(
      messages(quizQuestionSchema.safeParse({ ...base, text: 'Q?', options: [{ text: 'A' }, { text: 'B' }] }))
        .correctIndex,
    ).toMatch(/exactly one/)
    const tooMany = Array.from({ length: 7 }, (_, index) => ({ text: `O${index}` }))
    expect(
      messages(quizQuestionSchema.safeParse({ ...base, text: 'Q?', options: tooMany, correctIndex: 0 }))
        .options,
    ).toMatch(/2 to 6/)
  })

  it('maps the correct option and text answers to the request', () => {
    const choice = formToQuestionRequest(
      {
        ...questionToForm(),
        text: 'Largest planet?',
        options: [{ text: 'Mars' }, { text: 'Jupiter' }],
        correctIndex: 1,
      },
      true,
    )
    expect(choice.options).toEqual([
      { text: 'Mars', correct: false },
      { text: 'Jupiter', correct: true },
    ])
    expect(choice).not.toHaveProperty('acceptedAnswers')

    const text = formToQuestionRequest(
      {
        ...questionToForm(undefined, 'giveAnswer'),
        text: 'Symbol for gold?',
        acceptedAnswers: [{ value: ' Au ' }],
      },
      true,
    )
    expect(text).toMatchObject({ quizType: 'giveAnswer', answerType: 'text', acceptedAnswers: ['Au'] })
    expect(text).not.toHaveProperty('options')
  })
})

describe('merchant schema', () => {
  it('requires an https tracking URL containing {subId} and cashback 0–100', () => {
    const values = {
      ...merchantToForm(),
      name: 'Nykaa',
      categoryId: 'beauty',
      rewardText: '5%',
      description: 'd',
      cashbackPercent: 120,
      trackingUrlTemplate: 'http://x.com/?s=1',
    }
    const errors = messages(merchantSchema.safeParse(values))
    expect(errors.cashbackPercent).toMatch(/0 and 100/)
    expect(errors.trackingUrlTemplate).toBeDefined()
    expect(
      merchantSchema.safeParse({
        ...values,
        cashbackPercent: 5,
        trackingUrlTemplate: 'https://t.example/c?sub={subId}',
      }).success,
    ).toBe(true)
  })
})

describe('product schema', () => {
  const valid = {
    ...emptyProduct(),
    name: 'Headphones',
    price: 1299,
    affiliateUrl: 'https://amazon.in/dp/X?ascsubtag={subId}',
  }

  it('accepts a valid product and defaults the currency', () => {
    expect(productSchema.safeParse(valid).success).toBe(true)
    expect(formToProductRequest({ ...valid, currencySymbol: '' }, true)).toMatchObject({
      currencySymbol: null,
      price: 1299,
      rewardText: null,
    })
  })

  it('enforces originalPrice >= price, rating 0–5 with one decimal and https links', () => {
    const errors = messages(
      productSchema.safeParse({ ...valid, originalPrice: 999, rating: 4.25, affiliateUrl: 'http://x' }),
    )
    expect(errors.originalPrice).toMatch(/lower than the price/)
    expect(errors.rating).toMatch(/1 decimal/)
    expect(errors.affiliateUrl).toMatch(/https/)
  })

  it('parses spreadsheet rows and skips a header', () => {
    const rows = parseSpreadsheet(
      'name\tprice\tmrp\turl\nboAt\t1,299\t3990\thttps://a.in/x?s={subId}\nJBL\t₹999\t\thttps://a.in/y',
      5,
    )
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      name: 'boAt',
      price: 1299,
      originalPrice: 3990,
      affiliateUrl: 'https://a.in/x?s={subId}',
      sortOrder: 5,
    })
    expect(rows[1]).toMatchObject({ name: 'JBL', price: 999, originalPrice: null, sortOrder: 6 })
  })
})

describe('configuration schemas', () => {
  it('serializes the check-in cycle', () => {
    expect(checkInToValue({ cycle: [{ coins: 10 }, { coins: 15 }] })).toEqual({ cycle: [10, 15] })
  })

  it('rejects spin wheels with zero total weight or duplicate ids', () => {
    const segment = { id: 's1', label: '5', coins: 5, color: '#6A4BE0', weight: 0 }
    const errors = messages(
      spinWheelForm.safeParse({ maxSpinsPerDay: 3, segments: [segment, { ...segment }] }),
    )
    expect(errors.segments).toMatch(/weight above 0/)
    expect(errors['segments.1.id']).toMatch(/unique/)
  })
})

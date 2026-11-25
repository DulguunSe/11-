import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import { all } from '../db.ts'
import { aiConfigured, env } from '../lib/env.ts'
import { getSettings } from '../lib/settings.ts'
import { WEEKDAYS, parseYmd } from '../lib/time.ts'
import { HttpError } from '../http.ts'

/**
 * Claude (Anthropic) дээр суурилсан контент үүсгэгч.
 * Түлхүүр: серверийн ANTHROPIC_API_KEY орчны хувьсагч.
 * Загвар: CLAUDE_MODEL (анхдагч claude-opus-5-5).
 */
let client: Anthropic | null = null
function claude() {
  if (!aiConfigured()) throw new HttpError(503, 'AI тохируулаагүй байна: серверт ANTHROPIC_API_KEY орчны хувьсагч оруулна уу.')
  return (client ??= new Anthropic())
}

/** Refusal болон алдааг монгол мессеж болгоно */
function aiError(e: unknown): never {
  if (e instanceof HttpError) throw e
  if (e instanceof Anthropic.AuthenticationError) throw new HttpError(502, 'AI түлхүүр (ANTHROPIC_API_KEY) буруу байна.')
  if (e instanceof Anthropic.RateLimitError) throw new HttpError(503, 'AI үйлчилгээ завгүй байна. Хэдэн минутын дараа дахин оролдоно уу.')
  if (e instanceof Anthropic.BadRequestError) throw new HttpError(502, `AI хүсэлт буруу: ${e.message}`)
  if (e instanceof Anthropic.APIError) throw new HttpError(502, `AI үйлчилгээний алдаа (${e.status ?? 'сүлжээ'}). Дахин оролдоно уу.`)
  throw new HttpError(502, `AI алдаа: ${e instanceof Error ? e.message : String(e)}`)
}

/* ------------------------------------------------------------------ */
/* Постын төлөвлөгөө                                                    */
/* ------------------------------------------------------------------ */
export const POST_KINDS = ['tip', 'service', 'promo', 'faq', 'kids', 'whitening', 'trust', 'seasonal'] as const

const PostSchema = z.object({
  kind: z.enum(POST_KINDS),
  topic: z.string().describe('Short internal title of the post in Mongolian (max ~60 chars)'),
  caption: z
    .string()
    .describe('Facebook/Instagram caption in natural Mongolian Cyrillic. No hashtags, no URLs. 300-900 characters, short paragraphs.'),
  hashtags: z.array(z.string()).describe('3-6 hashtags without spaces, each starting with #'),
  template: z.enum(['photo', 'tip', 'promo', 'quote']),
  headline: z.string().describe('Text on the image, Mongolian, max 45 characters, no emoji'),
  subline: z.string().describe('Supporting line on the image, Mongolian, max 90 characters, no emoji. Empty string if not needed.'),
  points: z.array(z.string()).describe('For the "tip" template: 3-4 short bullet points (max 45 characters each). Otherwise an empty array.'),
  badge: z.string().describe('Small label on the image, 1-2 words, max 16 characters (e.g. "Зөвлөгөө", "Онцлох")'),
  media_id: z
    .number()
    .int()
    .nullable()
    .describe('ID of the photo from the photo library to use for "photo" or "promo" templates, or null'),
})
const PlanSchema = z.object({ posts: z.array(PostSchema) })
export type PlannedPost = z.infer<typeof PostSchema>

function brandContext() {
  const clinic = getSettings('clinic')
  const brand = getSettings('brand')
  const services = all<{ name: string; description: string; price: number; price_note: string }>(
    'SELECT name, description, price, price_note FROM services WHERE active = 1 ORDER BY sort, id',
  )
  const emoji = { none: 'Do not use emoji.', light: 'Use at most 1-2 emoji per post.', moderate: 'Use a few relevant emoji (3-5 per post).' }[brand.emoji]
  return [
    `Clinic: ${clinic.name} (${clinic.city}). Address: ${clinic.address}. Phones: ${[clinic.phone1, clinic.phone2].filter(Boolean).join(', ')}.`,
    `About the clinic:\n${brand.about}`,
    `Target audience:\n${brand.audience}`,
    `Tone of voice:\n${brand.tone}`,
    `Emoji: ${emoji}`,
    `Brand hashtags (always include 1-2 of these): ${brand.hashtags}`,
    `Services:\n${services.map((s) => `- ${s.name}: ${s.description}${s.price ? ` (үнэ: ${s.price.toLocaleString('en-US')}₮${s.price_note ? ', ' + s.price_note : ''})` : ''}`).join('\n')}`,
    brand.promos ? `Current promotions (mention only these, exactly as written):\n${brand.promos}` : 'There are no current promotions or discounts. Never invent prices, discounts or offers.',
    `Rules that must always be followed:\n${brand.rules}`,
    brand.styleGuide ? `Writing style learned from the clinic's own past posts:\n${brand.styleGuide}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
}

const SYSTEM = `You are the social media manager of a family dental clinic in Mongolia. You write organic Facebook and Instagram posts in natural, fluent Mongolian (Cyrillic) for the clinic's own page.

Each post has a caption plus a designed image. You choose one of four image templates:
- "photo": a clinic photo with a headline below it. Good for services, trust, the clinic itself. Choose a fitting media_id.
- "tip": a list of 3-4 short tips. Good for dental-health advice.
- "promo": a bold dark design with a photo. Good for a featured service (e.g. Japanese whitening) or a real current promotion.
- "quote": a short bold message on a blue gradient. Good for greetings, holidays, short facts.

Write captions that a local family would actually stop to read: a strong first line, 2-4 short paragraphs, practical and accurate dental information, warm and trustworthy. End the caption with a short call to action to book online or call (the booking link and phone numbers are added automatically after your caption, so do not write URLs or phone numbers yourself). Do not put hashtags inside the caption; return them separately.

Medical accuracy matters: give only well-established, general dental advice; never promise guaranteed results; never diagnose; suggest seeing the dentist for anything specific. Vary the post types across the plan and do not repeat recent topics.`

export async function planPosts(opts: { dates: string[]; focus?: string; recentTopics: string[] }) {
  const media = all<{ id: number; description: string }>(`SELECT id, description FROM media WHERE kind = 'photo' ORDER BY id DESC LIMIT 40`)
  const dateList = opts.dates.map((d) => `- ${d} (${WEEKDAYS[parseYmd(d.slice(0, 10)).getDay()]})`).join('\n')
  const user = [
    brandContext(),
    `Photo library (choose media_id from these for "photo"/"promo" templates):\n${media.length ? media.map((m) => `- id ${m.id}: ${m.description || 'тайлбаргүй зураг'}`).join('\n') : '(no photos; use the "tip" or "quote" templates, or media_id null)'}`,
    `Recently published or planned topics (do not repeat these):\n${opts.recentTopics.length ? opts.recentTopics.map((t) => `- ${t}`).join('\n') : '(none yet)'}`,
    `Create exactly ${opts.dates.length} posts, one for each of these publication dates, in this order. If a date is a well-known Mongolian holiday or occasion, you may make that day's post a greeting.\n${dateList}`,
    opts.focus ? `Special request from the clinic for this batch: ${opts.focus}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  try {
    const res = await claude().beta.messages.parse({
      model: env.claudeModel,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: betaZodOutputFormat(PlanSchema) },
      system: SYSTEM,
      messages: [{ role: 'user', content: user }],
    })
    if (res.stop_reason === 'refusal') throw new HttpError(422, 'AI энэ хүсэлтэд хариулахаас татгалзлаа. Сэдвээ өөрчлөөд дахин оролдоно уу.')
    if (res.stop_reason === 'max_tokens') throw new HttpError(502, 'AI хариулт хэт урт болсон. Цөөн пост үүсгэж үзнэ үү.')
    const plan = res.parsed_output
    if (!plan?.posts?.length) throw new HttpError(502, 'AI хариулт хоосон ирлээ. Дахин оролдоно уу.')
    const mediaIds = new Set(media.map((m) => m.id))
    return plan.posts.slice(0, opts.dates.length).map((p) => ({
      ...p,
      media_id: p.media_id && mediaIds.has(p.media_id) ? p.media_id : null,
      headline: p.headline.slice(0, 60),
      subline: p.subline.slice(0, 120),
      badge: p.badge.slice(0, 20),
      points: p.points.slice(0, 4).map((x) => x.slice(0, 60)),
      hashtags: p.hashtags
        .map((t) => (t.startsWith('#') ? t : `#${t}`).replace(/\s+/g, ''))
        .slice(0, 8),
    }))
  } catch (e) {
    aiError(e)
  }
}

/** Эмнэлгийн өмнөх постуудаас бичих хэв маягийг сурах */
export async function learnStyle(samples: string) {
  try {
    const res = await claude().beta.messages.create({
      model: env.claudeModel,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system:
        'You analyse a Mongolian dental clinic\'s past social media posts and write a concise style guide (in Mongolian, 6-10 bullet points, under 1200 characters) describing their tone, typical structure, sentence length, emoji and hashtag habits, recurring phrases and how they address readers. Output only the bullet list.',
      messages: [{ role: 'user', content: `Past posts:\n\n${samples.slice(0, 12000)}` }],
    })
    if (res.stop_reason === 'refusal') throw new HttpError(422, 'AI энэ хүсэлтэд хариулахаас татгалзлаа.')
    const text = res.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n').trim()
    if (!text) throw new HttpError(502, 'AI хариулт хоосон ирлээ.')
    return text.slice(0, 4000)
  } catch (e) {
    aiError(e)
  }
}

/** Зургийн товч тайлбар (AI аль зургийг ашиглахаа сонгоход) */
export async function describeImage(absPath: string) {
  const jpeg = await sharp(readFileSync(absPath)).rotate().resize({ width: 1024, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()
  try {
    const res = await claude().beta.messages.create({
      model: env.claudeModel,
      max_tokens: 1000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: jpeg.toString('base64') } },
            {
              type: 'text',
              text: 'Энэ зураг шүдний эмнэлгийн сошиал постонд ашиглагдана. Зурагт юу байгааг монголоор 1 өгүүлбэрээр (120 тэмдэгтээс ихгүй) товч тайлбарла. Зөвхөн тайлбараа бич.',
            },
          ],
        },
      ],
    })
    if (res.stop_reason === 'refusal') return ''
    return res.content
      .flatMap((b) => (b.type === 'text' ? [b.text] : []))
      .join(' ')
      .trim()
      .slice(0, 200)
  } catch (e) {
    aiError(e)
  }
}

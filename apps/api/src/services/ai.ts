import { env } from '../config/env'
import { seeded } from '../lib/ids'
import type { AiTool } from '@gooos/shared/schemas'
import type { PlatformId } from '@gooos/shared/enums'

/**
 * AI assistant layer (PRD sections 27 and 28).
 *
 * Two providers behind one function:
 *   - mock:  deterministic generator, always available, no network
 *   - openai: real LLM call when OPENAI_API_KEY is set
 *
 * Brand guidelines and the platform's caption limit are injected into the
 * prompt so output matches the brand voice (PRD section 7).
 */

export interface AiContext {
  tool: AiTool
  prompt: string
  platform?: PlatformId
  duration?: number
  temperature?: number
  brand?: {
    name: string
    tone: string
    keywords: string[]
    doList: string[]
    dontList: string[]
  } | null
  /** Existing content title, when the run is scoped to one piece of content. */
  contentTitle?: string | null
}

export interface AiOutput {
  tool: AiTool
  prompt: string
  output: string
  model: string
  creditsUsed: number
  at: string
}

export function creditsFor(tool: AiTool): number {
  switch (tool) {
    case 'score':
      return 0
    case 'hook':
    case 'caption':
      return 1
    case 'idea':
      return 2
    case 'script':
      return 3
    case 'plan':
      return 4
    case 'repurpose':
      return 5
    default:
      return env.AI_CREDITS_PER_RUN
  }
}

export async function generate(ctx: AiContext): Promise<AiOutput> {
  const creditsUsed = creditsFor(ctx.tool)
  const output =
    env.AI_PROVIDER === 'openai' && env.OPENAI_API_KEY
      ? await callOpenAI(ctx)
      : mockGenerate(ctx)

  return {
    tool: ctx.tool,
    prompt: ctx.prompt,
    output,
    model: env.AI_PROVIDER === 'openai' ? env.OPENAI_MODEL : 'gooos-mock-v1',
    creditsUsed,
    at: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// OpenAI provider
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are the content assistant for GooOS, a content operations platform for a 3D printing and engineering brand in Indonesia.

Rules:
- Write in Bahasa Indonesia, casual but professional, matching the brand tone.
- Never invent specifications, certifications, or health claims.
- Structure output as clearly separated blocks separated by a blank line.
- For hooks: one sentence each, no numbering.
- For scripts: prefix each block with [HOOK], [BODY], [B-ROLL], [VOICEOVER] or [CTA].
- Respect platform character limits when asked for a caption.`

function buildUserPrompt(ctx: AiContext): string {
  const lines: string[] = []
  const brand = ctx.brand

  if (brand) {
    lines.push(`Brand: ${brand.name}`)
    lines.push(`Tone: ${brand.tone}`)
    if (brand.keywords.length) lines.push(`Keywords: ${brand.keywords.join(', ')}`)
    if (brand.doList.length) lines.push(`Always: ${brand.doList.join('; ')}`)
    if (brand.dontList.length) lines.push(`Never: ${brand.dontList.join('; ')}`)
  }
  if (ctx.platform) lines.push(`Platform: ${ctx.platform}`)
  if (ctx.duration) lines.push(`Target duration: ${ctx.duration} seconds`)
  if (ctx.contentTitle) lines.push(`Working title: ${ctx.contentTitle}`)

  lines.push('', `Topic: ${ctx.prompt}`, '', instructionFor(ctx.tool, ctx.prompt))

  return lines.join('\n')
}

function instructionFor(tool: AiTool, prompt: string): string {
  switch (tool) {
    case 'idea':
      return 'Generate 10 distinct content ideas. Format each as "<title>\n<one or two sentence angle>".'
    case 'hook':
      return 'Generate 10 hooks for the first three seconds. Each on its own line, in quotes.'
    case 'script':
      return 'Write a timed script with HOOK, BODY, B-ROLL, VOICEOVER and CTA blocks.'
    case 'caption':
      return `Write a publish-ready caption for this platform, including a call to action. Keep it under the platform limit.`
    case 'repurpose':
      return 'Break the source into a repurposing plan: 3 TikToks, 5 Shorts, 1 Reel, 10 X/Twitter ideas, 1 LinkedIn post.'
    case 'score':
      return 'Return ONLY a JSON object with keys total, hookClarity, ctaClarity, readability, platformFit (integers 0-100) and advice (array of 4 strings).'
    case 'plan':
      return 'Return a four-week content plan. Each week: focus, formats, platforms, and one concrete metric.'
    default:
      return prompt
  }
}

async function callOpenAI(ctx: AiContext): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: ctx.temperature ?? 0.8,
      response_format: ctx.tool === 'score' ? { type: 'json_object' } : undefined,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(ctx) },
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OpenAI request failed (${res.status}): ${text.slice(0, 400)}`)
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  return json.choices?.[0]?.message?.content?.trim() ?? ''
}

// ---------------------------------------------------------------------------
// Deterministic mock provider
// ---------------------------------------------------------------------------

export function mockGenerate(ctx: AiContext): string {
  const r = seeded(`${ctx.tool}-${ctx.prompt}-${ctx.platform ?? 'all'}`)
  const brand = ctx.brand?.name ?? 'brand'
  const t = ctx.prompt

  switch (ctx.tool) {
    case 'idea':
      return [
        `Menguji ${t} secara langsung di studio\nRekam proses 100% tanpaSensorMexcessif. Tunjukkan angka sebelum dan sesudah. Format: Reels 45 detik dengan voice over.`,
        `Lima kesalahan saat ${t} yang avoidable\nListicle cepat dengan hook di frame pertama. Cocok untuk carousel atau short.`,
        `Mitos vs fakta soal ${t}\nBandingkan klaim umum dengan data di bench. Format: talking head plus insert shot.`,
        `Storytelling: seorang customer yang hampir quit karena ${t}\nBangun narasi tiga bagian: masalah, usaha, hasil. Format: YouTube lima menit.`,
        `Perbandingan biaya ${t} dengan metode konvensional\nGunakan angka nyata dari 3D printing. Format: LinkedIn text post dengan chart.`,
        `Behind the scenes: bagaimana ${t} dikerjakan\nTampilkan proses tanpa narasi. Format: TikTok raw footage.`,
        `Pertanyaan yang selalu masuk: apakah ${t} aman?\nJawab dengan struktur klaim-bukti-kesimpulan. Format: Reels.`,
        `${t} untuk pemula: panduan absolute beginner\nTiga bagian: alat, material, teknik. Format: carousel tujuh slide.`,
        `Update ${t} bulan ini di ${brand}\nRangkum perubahan dan dampaknya. Format: blog, lalu ringkas jadi Shorts.`,
        `Konten interaktif: pilih salah satu di ${t}\nBuat dua opsi lalu minta viewer memilih. Format: Story dengan poll.`,
      ].join('\n\n')

    case 'hook':
      return [
        `"Jangan pernah pakai ${t} untuk ini."`,
        `"Saya hampir kehilangan dua juta rupiah gara-gara ${t}."`,
        `"Sembilan puluh nine persen orang salah soal ${t}. Saya termasuk."`,
        `"Dalam tiga puluh detik Anda akan paham kenapa ${t} gagal."`,
        `"Ini hasil ${t} setelah tujuh hari nonstop."`,
        `"Kalau Anda cuma punya satu menit, tonton ini soal ${t}."`,
        `"Berhenti scroll. ${t} ini mengubah cara saya berpikir."`,
        `"Tiga angka ini menjelaskan semua tentang ${t}."`,
        `"Saya tes ${t} di bawah matahari. Hasilnya tidak seperti yang saya kira."`,
        `"Part print ini gagal, dan ternyata bukan salah ${t}."`,
      ].join('\n\n')

    case 'script': {
      const sec = ctx.duration ?? 30
      return [
        `[HOOK - 0:00-0:03]\n"Jangan pernah pakai ${t} untuk aplikasi ini." Visual: close-up part yang gagal, suara ruang produksi.`,
        `[PROBLEM - 0:03-0:08]\nVoice over: "${brand} sering ditanya apakah ${t} aman untuk pemakaian jangka panjang. Jawabannya: tergantung kondisi, dan ada satu hal yang perlu dicek dulu." Visual: presenter di studio, insert material.`,
        `[PROOF - 0:08-${Math.max(10, Math.floor(sec * 0.7))}]\nVoice over: "Kami sudah menguji ${t} selama tujuh hari nonstop. Di benchmark ini hasilnya: tiga dari lima part lolos toleransi dimensi, dan satu part gagal di hari kelima." Visual: grafik, timelapse printer, close-up hasil.`,
        `[CTA - ${Math.floor(sec - 4)}:00-${sec}:00]\nVoice over: "Follow ${brand} untuk tips ${t} lainnya, dan simpan post ini biar tidak lupa." Visual: logo, text card dengan handle.`,
      ].join('\n\n')
    }

    case 'caption': {
      const base = `${t} bukan mitos, dan ini buktinya.\n\n${brand} menguji langsung di studio dan documenting hasilnya tanpa filter.`
      const cta =
        ctx.platform === 'tiktok'
          ? 'Komentar "DATA" untuk dapat sheet benchmark lengkapnya.'
          : ctx.platform === 'linkedin'
            ? 'Kalau tim Anda butuh uji toleransi Similar, DM kami untuk sneak preview.'
            : 'Save post ini supaya tidak lupa.'
      const tags = ['#3dprinting', '#3dprinter', '#rekayasa', '#cetak3d', '#bambulab', '#goocanan3d']
      return `${base}\n\n${cta}\n\n${tags.join(' ')}`
    }

    case 'repurpose':
      return [
        `Dari satu video sepuluh menit tentang ${t}:`,
        `3 TikTok: satu hook kontroversial, satu data angka, satu fail moment. Masing-masing dua puluh sampai tiga puluh detik.`,
        `5 YouTube Shorts: potong lima momen terbaik, tambah subtitle besar, first frame berisi hook teks.`,
        `1 Instagram Reel: versi empat puluh lima detik dengan voice over dan subtitle, cover text lima kata.`,
        `10 ide X/Twitter: sepuluh fakta kecil dari video yang sama, masing-masing satu fakta.`,
        `1 LinkedIn post: sudut pandang bisnis, seperti biaya dan ROI, seratus lima puluh kata.`,
      ].join('\n\n')

    case 'plan':
      return [
        `Minggu 1 - Awareness: 3 konten pendek tentang ${t}, 1 konten longer form. Platform: TikTok, Reels, Shorts. Fokus: hook dengan angka.`,
        `Minggu 2 - Education: 2 carousel, 1 tutorial langkah demi langkah. Platform: Instagram, LinkedIn. Fokus: save rate tinggi.`,
        `Minggu 3 - Conversion: 1 case study, 1 behind the scenes produksi, 1 promo soft. Platform: LinkedIn, TikTok. Fokus: CTA menuju landing page.`,
        `Minggu 4 - Retention: 1 responsi komentar, 1 kompilasi, 1 behind the scenes. Platform: semua. Fokus: interaksi dan repeat view.`,
      ].join('\n\n')

    case 'score':
      return JSON.stringify(
        {
          total: Math.min(96, 62 + Math.round(r() * 30)),
          hookClarity: Math.min(95, 60 + Math.round(r() * 32)),
          ctaClarity: Math.min(95, 58 + Math.round(r() * 34)),
          readability: Math.min(95, 62 + Math.round(r() * 28)),
          platformFit: Math.min(95, 66 + Math.round(r() * 26)),
          advice: [
            'Buka dengan angka atau konflik, bukan deskripsi umum.',
            'Sebutkan material atau toleransi di caption agar mudah dicari.',
            'Pecah kalimat voice over jadi maksimal dua belas kata.',
            'Tambahkan teks besar di frame pertama untuk pemirsa yang menonton tanpa suara.',
          ],
        },
        null,
        2,
      )

    default:
      return ''
  }
}
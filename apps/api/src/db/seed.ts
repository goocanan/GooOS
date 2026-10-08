import { eq } from 'drizzle-orm'
import { db, schema, getDb } from './client'
import { migrate } from './migrate'
import { getAuth } from '../plugins/auth'
import { id, hexFromString, seeded } from '../lib/ids'
import { logActivity } from '../lib/activity'
import { storage } from '../lib/storage'
import type { PlatformId, ContentStatus, Priority } from '@gooos/shared/enums'

/**
 * Demo data seeder (PRD section 46, Phase 0).
 *
 * Ported from the frontend prototype's fixtures so the SPA looks identical once
 * it is switched to the API. Safe to re-run: it checks for existing users first
 * and no-ops.
 */

const DEMO_PASSWORD = 'gooos123'

const at = (dayOffset: number, hour = 9, minute = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d
}

// ---------------------------------------------------------------------------

const USERS = [
  { key: 'james', name: 'James Sibaran', email: 'james@goocanan3d.com', role: 'owner' as const, title: 'Founder', color: '#d23a67' },
  { key: 'krisda', name: 'Krisda Dewi', email: 'krisda@goocanan3d.com', role: 'manager' as const, title: 'Content Manager', color: '#38bdf8' },
  { key: 'raka', name: 'Raka Pratama', email: 'raka@goocanan3d.com', role: 'creator' as const, title: 'Video Editor', color: '#f59e0b' },
  { key: 'nadia', name: 'Nadia Rahman', email: 'nadia@goocanan3d.com', role: 'creator' as const, title: 'Social Media', color: '#34d399' },
  { key: 'budi', name: 'Budi Santoso', email: 'budi@goocanan3d.com', role: 'reviewer' as const, title: 'Brand Reviewer', color: '#a78bfa' },
  { key: 'andi', name: 'Andi (Koper Si Mami)', email: 'andi@kopersimami.id', role: 'client' as const, title: 'Client', color: '#fb923c' },
  { key: 'tari', name: 'Tari Wulandari', email: 'tari@goocanan3d.com', role: 'creator' as const, title: 'Photographer', color: '#e879f9' },
]

const WORKSPACES = [
  { key: 'goocanan', name: 'GOOCANAN 3D', slug: 'goocanan-3d', plan: 'pro' as const, contentLimit: 500, storageLimitMb: 51200, seatLimit: 10 },
  { key: 'mami', name: 'Koper Si Mami', slug: 'koper-si-mami', plan: 'creator' as const, contentLimit: 200, storageLimitMb: 10240, seatLimit: 2 },
  { key: 'personal', name: 'Personal Content', slug: 'personal', plan: 'free' as const, contentLimit: 30, storageLimitMb: 1024, seatLimit: 1 },
]

const BRANDS = [
  {
    key: 'goocanan', workspace: 'goocanan', name: 'GOOCANAN 3D',
    description: 'Jasa cetak 3D dan precision engineering untuk industri, arsitektur, dan maker Indonesia.',
    website: 'https://goocanan3d.com', logoText: 'G3D', color: '#b81e51',
    industry: 'Manufacturing / 3D Printing Service',
    audience: '3D printing hobbyist, arsitek, insinyur, dan UMKM produk jadi',
    socials: [
      { platform: 'instagram_reel', handle: '@goocanan3d' },
      { platform: 'tiktok', handle: '@goocanan3d' },
      { platform: 'youtube', handle: 'GOOCANAN 3D' },
      { platform: 'linkedin', handle: 'goocanan3d' },
    ],
    guidelines: {
      tone: 'Professional + Friendly - teknis tapi approachable, bahasa Indonesia casual',
      primaryColor: '#8B1E3F', secondaryColor: '#D4AF37',
      keywords: ['Precision', '3D Printing', 'Engineering', 'Innovation', 'STL Ready'],
      doList: ['Tunjukkan proses nyata di studio', 'Sertakan spesifikasi teknis', 'Gunakan Bahasa Indonesia'],
      dontList: ['Jangan janji hasil 100%', 'Hindari klaim kesehatan', 'Jangan pakai foto stok'],
      fonts: 'Inter (heading) / JetBrains Mono (spesifikasi)',
    },
  },
  {
    key: 'mami', workspace: 'mami', name: 'Koper Si Mami',
    description: 'Koper travel custom handmade untuk liburan keluarga.',
    website: 'https://kopersimami.id', logoText: 'KSM', color: '#a98a26',
    industry: 'Handmade / Retail',
    audience: 'Ibu muda dan traveler Indonesia',
    socials: [{ platform: 'instagram_post', handle: '@kopersimami' }],
    guidelines: {
      tone: 'Warm, playful, nostalgic',
      primaryColor: '#D4AF37', secondaryColor: '#8B1E3F',
      keywords: ['Handmade', 'Keluarga', 'Travel'],
      doList: ['Tampilkan detail jahitan', 'Ceritakan proses handmade'],
      dontList: ['Jangan klaim waterproof absolut'],
      fonts: 'Inter',
    },
  },
]

const CAMPAIGNS = [
  { key: 'a1', brand: 'goocanan', name: 'A1 Mini Launch', goal: 'Product Awareness', start: -12, end: 14, status: 'active' as const, color: '#b81e51', budget: 4500000 },
  { key: 'outdoor', brand: 'goocanan', name: 'PLA vs Outdoor', goal: 'Education', start: -4, end: 26, status: 'active' as const, color: '#f59e0b', budget: 2000000 },
  { key: 'october', brand: 'goocanan', name: 'October Product Launch', goal: 'Product Awareness', start: -20, end: 10, status: 'active' as const, color: '#38bdf8', budget: 7500000 },
  { key: 'mami_baru', brand: 'mami', name: 'Koleksi retainer', goal: 'Sales', start: -2, end: 28, status: 'active' as const, color: '#a98a26', budget: 900000 },
  { key: 'edu', brand: 'goocanan', name: 'Edu Series 3D Printing', goal: 'Education', start: -60, end: -10, status: 'completed' as const, color: '#34d399', budget: 1500000 },
]

interface ContentSeed {
  ref: number
  title: string
  description: string
  type: PlatformId
  status: ContentStatus
  priority: Priority
  creator: string
  reviewer?: string
  tags: string[]
  campaign?: string
  brand?: string
  due?: number
  scheduled?: number
  published?: number
  platforms?: PlatformId[]
  hook?: string
  topic?: string
  cta?: string
  progress: number
  ideaSource?: string
}

const CONTENTS: ContentSeed[] = [
  { ref: 1024, title: 'Testing Bambu A1 Mini - 7 hari nonstop', description: 'Timelapse A1 Mini selama 7 hari: throughput, nozzle swap, dan failure rate. Data original dari studio.', type: 'tiktok', status: 'review', priority: 'urgent', creator: 'raka', reviewer: 'budi', tags: ['A1 Mini', 'benchmark', 'review'], campaign: 'a1', due: 1, platforms: ['tiktok', 'instagram_reel', 'youtube_short', 'facebook_reel'], hook: 'A1 Mini jalan 7 hari nonstop tanpa mati - ini datanya.', topic: 'Bambu A1 Mini', cta: 'Follow untuk benchmark lengkap lainnya.', progress: 80 },
  { ref: 1031, title: 'Berapa biaya cetak satu part di 3D printing?', description: 'Breakdown biaya: filament, listrik, machine time, waste, dan labor. Dengan angka nyata dari 12 part.', type: 'instagram_reel', status: 'approved', priority: 'high', creator: 'nadia', reviewer: 'budi', tags: ['costing', 'edukasi', 'bisnis'], campaign: 'a1', due: 2, scheduled: 3, platforms: ['instagram_reel', 'tiktok'], hook: 'Berapakah biaya cetak satu part?', topic: 'Costing', progress: 100 },
  { ref: 1038, title: 'Kenapa PLA melengkung di dalam mobil?', description: 'Penjelasan glass transition temperature PLA dan kenapa part custom tidak boleh ditaruh di mobil.', type: 'tiktok', status: 'production', priority: 'high', creator: 'raka', tags: ['PLA', 'materi', 'tips'], campaign: 'outdoor', due: 4, progress: 45 },
  { ref: 1042, title: 'Unboxing filament GOOCANAN 3D - PETG & ABS', description: 'Unboxing paket filament plus giveaways diskon 20% untuk pembeli pertama.', type: 'instagram_post', status: 'scheduled', priority: 'medium', creator: 'nadia', reviewer: 'budi', tags: ['unboxing', 'filament', 'promo'], campaign: 'a1', due: -1, scheduled: 1, platforms: ['instagram_post', 'instagram_story', 'facebook_post'], progress: 100 },
  { ref: 1046, title: '5 setting Slicer wajib untuk first-time printer', description: 'Checklist 5 setting di Cura/OrcaSlicer yang bikin hasil pertama langsung rapi.', type: 'youtube_short', status: 'script', priority: 'medium', creator: 'raka', tags: ['slicer', 'beginner', 'tutorial'], campaign: 'outdoor', due: 6, progress: 25 },
  { ref: 1029, title: 'PLA vs PETG untuk bracket engine', description: 'Uji beban bracket engine dari dua material. Mana yang lebih keras?', type: 'youtube', status: 'editing', priority: 'urgent', creator: 'raka', reviewer: 'krisda', tags: ['PLA', 'PETG', 'engineering'], campaign: 'outdoor', due: 0, platforms: ['youtube', 'instagram_reel'], progress: 65 },
  { ref: 1018, title: 'Tutorial: order STL di GOOCANAN 3D', description: 'Step-by-step cara order file STL dan memilih material yang benar.', type: 'blog', status: 'published', priority: 'low', creator: 'krisda', tags: ['tutorial', 'order'], campaign: 'october', published: -8, platforms: ['blog', 'linkedin'], progress: 100 },
  { ref: 1021, title: 'Miniatur rumah dari STL gratis - free download', description: 'Share 10 STL rumah gratis untuk penghobi, ajakan download dan follow.', type: 'instagram_post', status: 'published', priority: 'medium', creator: 'nadia', tags: ['freebie', 'STL'], campaign: 'october', published: -5, platforms: ['instagram_post', 'facebook_post', 'x'], progress: 100 },
  { ref: 1026, title: 'Reels: 3 kesalahan nozzle printing', description: 'Tiga kesalahan paling umum saat ganti nozzle. Format cepat 20 detik.', type: 'instagram_reel', status: 'published', priority: 'high', creator: 'raka', tags: ['tips', 'nozzle', 'short'], campaign: 'october', published: -3, platforms: ['instagram_reel', 'tiktok', 'youtube_short'], progress: 100 },
  { ref: 1050, title: 'Trend: miniatur rumah yang viral di 2026', description: 'Ikuti tren miniatur rumah yang viral dan jalankan giveaways.', type: 'tiktok', status: 'idea', priority: 'low', creator: 'nadia', tags: ['trend', 'miniatur'], due: 20, progress: 0, ideaSource: 'TikTok Creative Center' },
  { ref: 1051, title: 'Review resin printer untuk detail halus', description: 'Bandingkan surface finish resin vs FDM untuk part kecil.', type: 'youtube', status: 'idea', priority: 'medium', creator: 'raka', tags: ['resin', 'review'], due: 24, progress: 0, ideaSource: 'Google Trends' },
  { ref: 1052, title: 'Behind the scenes: quality control GOOCANAN', description: 'Reels proses QC sebelum part dikirim ke customer.', type: 'instagram_reel', status: 'planned', priority: 'medium', creator: 'tari', tags: ['BTS', 'QC', 'trust'], due: 8, progress: 10 },
  { ref: 1053, title: 'Case study: bracket custom untuk motor racing', description: 'Story dari customer motorsport: dari STL sampai part jadi.', type: 'linkedin', status: 'planned', priority: 'high', creator: 'krisda', tags: ['case study', 'B2B'], due: 9, progress: 15 },
  { ref: 1054, title: 'Cara memilih filament untuk beginner', description: 'Panduan singkat pilih PLA / PETG / ABS untuk pemula.', type: 'instagram_story', status: 'planned', priority: 'low', creator: 'nadia', tags: ['beginner', 'filament'], due: 11, progress: 5 },
  { ref: 1055, title: 'Top 10 STL gratis 2026 (kumpulan)', description: 'Kumpulan 10 STL gratis yang paling banyak didownload bulan ini.', type: 'blog', status: 'scheduled', priority: 'medium', creator: 'krisda', tags: ['STL', 'kumpulan', 'SEO'], due: 3, scheduled: 5, platforms: ['blog', 'linkedin', 'x'], progress: 100 },
  { ref: 1056, title: 'Printer jam vs resin: mana untuk part 3 cm?', description: 'Komparasi cepat untuk part kecil dengan detail tinggi.', type: 'tiktok', status: 'published', priority: 'medium', creator: 'raka', tags: ['resin', 'FDM', 'comparison'], published: -12, platforms: ['tiktok', 'instagram_reel'], progress: 100 },
  { ref: 1057, title: 'Cara kalibrasi bed leveling dengan benar', description: 'Tutorial video bed leveling sampai first layer perfect.', type: 'youtube', status: 'published', priority: 'high', creator: 'raka', tags: ['tutorial', 'calibration'], published: -19, platforms: ['youtube', 'tiktok', 'youtube_short'], progress: 100 },
  { ref: 1058, title: 'Kenapa kami memakai merah marun', description: 'Penjelasan singkat pilihan warna brand untuk industri.', type: 'linkedin', status: 'archived', priority: 'low', creator: 'krisda', tags: ['brand', 'story'], published: -70, progress: 100 },
  { ref: 1059, title: 'Promo akhir tahun: diskon 25% semua material', description: 'Konten promosi akhir tahun dengan CTA ke landing page.', type: 'ads', status: 'review', priority: 'urgent', creator: 'nadia', reviewer: 'budi', tags: ['promo', 'ads', 'Q4'], due: 1, platforms: ['instagram_post', 'facebook_post'], progress: 90 },
  { ref: 1060, title: 'Voice over: tips menyimpan filament rapi', description: 'Script voice over dan b-roll untuk tips penyimpanan filament.', type: 'instagram_reel', status: 'script', priority: 'low', creator: 'raka', tags: ['tips', 'filament'], due: 15, progress: 20 },
  { ref: 1061, title: 'Reply thread: kenapa harga cetak custom mahal?', description: 'Turn salah satu thread komentar jadi konten edukasi dengan data.', type: 'x', status: 'idea', priority: 'medium', creator: 'nadia', tags: ['community', 'pricing'], due: 18, progress: 0, ideaSource: 'Community comment' },
  { ref: 1062, title: 'Carousel: 7 step cetak 3D dari STL', description: 'Carousel Instagram 7 slide untuk educate audiens baru.', type: 'instagram_post', status: 'editing', priority: 'medium', creator: 'nadia', reviewer: 'krisda', tags: ['carousel', 'edukasi'], due: 2, platforms: ['instagram_post'], progress: 70 },
]

const ASSETS: [string, string, string, number][] = [
  ['A1_mini_7day_timelapse.mp4', 'video', 'Video', 148000],
  ['a1_mini_thumb_v3.png', 'image', 'Thumbnail', 2400],
  ['pla_deform_demo.mp4', 'video', 'B-Roll', 62000],
  ['bracket_petg_loadtest.mp4', 'video', 'B-Roll', 88000],
  ['goocanan_logo_dark.svg', 'image', 'Logo', 46],
  ['goocanan_logo_light.svg', 'image', 'Logo', 48],
  ['studio_tour_01.jpg', 'image', 'Photo', 6200],
  ['bambu_a1mini_box.jpg', 'image', 'Product', 3100],
  ['filament_petg_rack.jpg', 'image', 'Photo', 4800],
  ['casting_bracket_final.stl', 'model', 'STL Models', 1820],
  ['enclosure_lid_v2.3mf', 'model', 'STL Models', 3400],
  ['filament_datasheet_v4.pdf', 'document', 'Documents', 820],
  ['brand_guideline_2026.pdf', 'document', 'Documents', 4500],
  ['nadia_voiceover_take3.wav', 'audio', 'Video', 22000],
  ['before_after_bedlevel.mp4', 'video', 'Video', 44000],
  ['carousel_slide_01.png', 'image', 'Thumbnail', 780],
  ['carousel_slide_02.png', 'image', 'Thumbnail', 810],
  ['carousel_slide_03.png', 'image', 'Thumbnail', 795],
  ['qc_macro_shot.jpg', 'image', 'Photo', 5400],
  ['spool_closeup_macro.jpg', 'image', 'Photo', 2900],
]

const IDEAS: [string, string, PlatformId, string, Priority, number][] = [
  ['Apakah PLA bisa dipakai untuk outdoor?', 'Uji part di bawah matahari langsung, lalu uji kompresi setelah 7 hari.', 'youtube', 'PLA', 'high', 14],
  ['Serial "Gagal cetak" - subscriber weekly fail', 'Format humor: tampilkan 3 kegagalan printing minggu ini.', 'tiktok', 'humor', 'medium', 22],
  ['Perbandingan biaya setahun', 'Total biaya filament terpakai untuk satu printer dalam setahun.', 'linkedin', 'costing', 'medium', 9],
  ['Stiker gratis GOOCANAN untuk laptop', 'Ajakan scan QR dapat stiker, sekaligus lead generation.', 'instagram_post', 'giveaway', 'low', 31],
  ['Tur virtual studio 3D', 'Reels 45 detik menunjukkan proses dari STL ke finished part.', 'instagram_reel', 'BTS', 'high', 17],
  ['Reply video untuk printer yang terlalu mahal', 'Respon video untuk thread yang sedang viral.', 'tiktok', 'community', 'medium', 6],
  ['Template caption 3D printing', 'Buat 5 template caption siap pakai untuk jadwal mingguan.', 'instagram_post', 'template', 'low', 12],
  ['Eksperimen: 5 material dalam 1 minggu', 'Serial konten dengan scoring sheet yang konsisten.', 'youtube', 'materi', 'high', 11],
  ['Konten untuk hari Industri 4.0', 'Angle: manufaktur lokal dan presisi.', 'linkedin', 'B2B', 'medium', 25],
  ['Cara baca STL file (free course)', 'Mini class 3 part sebagai lead magnet.', 'blog', 'edukasi', 'high', 28],
]

const HASHTAGS: [string, number, number, number, string][] = [
  ['3dprinting', 42, 1240000, 0.071, 'Core'],
  ['3dprinter', 38, 980000, 0.068, 'Core'],
  ['bambulab', 21, 760000, 0.094, 'Printer'],
  ['rekayasa', 17, 310000, 0.052, 'Industri'],
  ['cetak3d', 29, 640000, 0.061, 'Core'],
  ['goocanan3d', 44, 212000, 0.112, 'Brand'],
  ['diy', 9, 420000, 0.041, 'Umum'],
  ['stl', 12, 260000, 0.048, 'Umum'],
  ['printer3d', 15, 520000, 0.058, 'Printer'],
  ['engineering', 8, 180000, 0.036, 'Industri'],
  ['3dprintingindonesia', 11, 300000, 0.079, 'Lokal'],
  ['makerindonesia', 6, 120000, 0.064, 'Lokal'],
]

// ---------------------------------------------------------------------------

const DEMO_EMAIL = 'james@goocanan3d.com'

export async function maybeSeed(force = false) {
  await getDb()
  await migrate()

  const database = db()

  // Idempotency keys off the demo account specifically. Checking "any user
  // exists" would silently skip seeding whenever some unrelated account is
  // already present (for example after a manual sign-up).
  const demo = await database.query.users.findFirst({ where: eq(schema.users.email, DEMO_EMAIL) })
  if (demo && !force) return { seeded: false, reason: 'demo account already exists' }

  const auth = getAuth()

  // 1. Users through Better Auth so password hashes are correct.
  const userIds: Record<string, string> = {}
  for (const u of USERS) {
    try {
      const res = await auth.api.signUpEmail({
        body: { name: u.name, email: u.email, password: DEMO_PASSWORD },
        headers: new Headers(),
      })
      userIds[u.key] = res.user.id
      await database.update(schema.users).set({ title: u.title }).where(eq(schema.users.id, res.user.id))
    } catch {
      const found = await database.query.users.findFirst({ where: eq(schema.users.email, u.email) })
      if (found) userIds[u.key] = found.id
    }
  }

  // 2. Workspaces + memberships.
  const wsIds: Record<string, string> = {}
  for (const w of WORKSPACES) {
    const wsId = id('ws')
    wsIds[w.key] = wsId
    await database.insert(schema.workspaces).values({
      id: wsId,
      name: w.name,
      slug: w.slug,
      plan: w.plan,
      contentLimit: w.contentLimit,
      storageLimitMb: w.storageLimitMb,
      seatLimit: w.seatLimit,
    })
    const members =
      w.key === 'goocanan'
        ? USERS.filter((u) => u.key !== 'andi')
        : USERS.filter((u) => u.key === 'james')
    for (const m of members) {
      await database.insert(schema.workspaceMembers).values({
        workspaceId: wsId,
        userId: userIds[m.key]!,
        role: m.role,
      })
    }
    await database
      .update(schema.workspaces)
      .set({ seats: members.length })
      .where(eq(schema.workspaces.id, wsId))
  }

  // 3. Brands.
  const brandIds: Record<string, string> = {}
  for (const b of BRANDS) {
    const brandId = id('b')
    brandIds[b.key] = brandId
    await database.insert(schema.brands).values({
      id: brandId,
      workspaceId: wsIds[b.workspace]!,
      name: b.name,
      description: b.description,
      website: b.website,
      logoText: b.logoText,
      color: b.color,
      industry: b.industry,
      audience: b.audience,
      socials: b.socials as never,
      guidelines: b.guidelines,
    })
  }

  // 4. Campaigns.
  const campaignIds: Record<string, string> = {}
  for (const c of CAMPAIGNS) {
    const cid = id('c')
    campaignIds[c.key] = cid
    await database.insert(schema.campaigns).values({
      id: cid,
      workspaceId: wsIds['goocanan']!,
      brandId: brandIds[c.brand]!,
      name: c.name,
      goal: c.goal,
      start: at(c.start, 12),
      end: at(c.end, 12),
      status: c.status,
      color: c.color,
      budget: String(c.budget),
    })
  }

  // 5. Content + platform variants.
  const contentIds: string[] = []
  for (const c of CONTENTS) {
    const contentId = `ct_${c.ref}`
    contentIds.push(contentId)
    const platforms = c.platforms ?? [c.type]
    const brandKey = c.brand ?? (c.campaign ? (CAMPAIGNS.find((x) => x.key === c.campaign)?.brand ?? 'goocanan') : 'goocanan')

    await database.insert(schema.contents).values({
      id: contentId,
      ref: c.ref,
      workspaceId: wsIds['goocanan']!,
      brandId: brandIds[brandKey]!,
      campaignId: c.campaign ? campaignIds[c.campaign] : null,
      title: c.title,
      description: c.description,
      type: c.type,
      status: c.status,
      priority: c.priority,
      ownerId: userIds.james!,
      creatorId: userIds[c.creator]!,
      reviewerId: c.reviewer ? userIds[c.reviewer]! : null,
      tags: c.tags,
      deadline: c.due != null ? at(c.due, 12) : null,
      dueDate: c.due != null ? at(c.due, 17) : null,
      thumbnailColor: hexFromString(contentId),
      cta: c.cta ?? 'Follow untuk tips 3D printing lainnya.',
      brief: {
        objective: 'Awareness',
        audience: '3D printing hobbyist dan maker Indonesia',
        topic: c.topic ?? c.tags[0] ?? c.title,
        hook: c.hook ?? '',
        keyMessage: c.description,
        cta: c.cta ?? '',
        reference: ['https://goocanan3d.com/blog/pla-outdoor'],
        expectedDuration: c.type.includes('short') || c.type === 'tiktok' ? '30-45 sec' : '3-5 min',
      },
      productionProgress: c.progress,
      ideaSource: c.ideaSource ?? null,
      createdAt: at(-30 + c.ref % 20, 10),
      updatedAt: at(-(c.ref % 7), 11),
    })

    for (const [idx, p] of platforms.entries()) {
      const scheduledAt =
        c.scheduled != null && idx === 0
          ? at(c.scheduled, 19)
          : c.scheduled != null && idx < 3
            ? at(c.scheduled + 1, 12)
            : null
      const publishedAt = c.published != null ? at(c.published, 19) : null
      await database.insert(schema.contentPlatforms).values({
        id: id('cp'),
        contentId,
        platform: p,
        caption: `${c.hook ?? c.title}\n\nDi GOOCANAN 3D kami bantu dari STL sampai part jadi dengan presisi tinggi. Komentar "INFO" untuk info harga.`,
        hashtags: ['3dprinting', '3dprinter', 'goocanan3d', 'cetak3d'],
        scheduledAt,
        publishedAt,
        primaryDate: scheduledAt ?? publishedAt,
      })
    }
  }

  // 6. Assets - real (tiny) placeholder blobs so previews resolve.
  const assetIds: string[] = []
  for (const [i, row] of ASSETS.entries()) {
    const [name, kind, folder, sizeKb] = row
    const assetId = id('as')
    assetIds.push(assetId)
    const ext = name.split('.').pop()!
    const storageKey = `${wsIds['goocanan']}/seed/${assetId}.${ext}`
    // A 1x1 PNG-ish placeholder keeps bytes tiny; real uploads replace this.
    await storage.put(storageKey, Buffer.from(PLACEHOLDER, 'base64'))
    await database.insert(schema.assets).values({
      id: assetId,
      workspaceId: wsIds['goocanan']!,
      folder,
      name,
      kind: kind as never,
      ext,
      sizeKb,
      uploadedBy: userIds[['raka', 'nadia', 'krisda', 'tari'][i % 4]!]!,
      tags: [folder.toLowerCase()],
      storageKey,
      color: hexFromString(name),
      createdAt: at(-i, 14),
    })
  }

  // Link a couple of assets to content.
  for (const [i, contentId] of contentIds.entries()) {
    for (const assetId of assetIds.filter((_, idx) => idx % 3 === i % 3).slice(0, 2)) {
      await database.insert(schema.contentAssets).values({ contentId, assetId }).onConflictDoNothing()
    }
  }

  // 7. Scripts.
  const scripted = CONTENTS.filter((c) => ['script', 'editing', 'review', 'approved', 'scheduled', 'published'].includes(c.status)).slice(0, 8)
  for (const [i, c] of scripted.entries()) {
    await database.insert(schema.scripts).values({
      id: `sc_${c.ref}`,
      workspaceId: wsIds['goocanan']!,
      contentId: `ct_${c.ref}`,
      title: c.title,
      version: (i % 3) + 1,
      blocks: [
        { id: `blk_${c.ref}_1`, kind: 'hook', heading: 'HOOK', body: c.hook ?? `"Jangan pernah taruh print PLA di mobil!"` },
        { id: `blk_${c.ref}_2`, kind: 'broll', heading: 'B-ROLL', body: 'Tampilkan mobil parkir di bawah matahari. Close-up part yang melengkung.' },
        { id: `blk_${c.ref}_3`, kind: 'voiceover', heading: 'VOICEOVER', body: 'PLA punya glass transition temperature sekitar 60 derajat C. Begitu suhu melewati 55 sampai 60 derajat C, part mulai melunak dan kehilangan dimensi.' },
        { id: `blk_${c.ref}_4`, kind: 'cta', heading: 'CTA', body: c.cta ?? 'Follow untuk tips 3D printing lainnya.' },
      ],
      updatedAt: at(-(i % 5), 10),
    })
  }

  // 8. Comments + approvals.
  const COMMENTS: [string, string, string, number | null, 'comment' | 'change_request' | 'approval', boolean][] = [
    ['ct_1024', 'budi', 'Hook di 0:03 masih lemah. Tolong mulai langsung dengan angka hasil.', 3, 'change_request', false],
    ['ct_1024', 'krisda', 'B-roll di 0:17 blur, perlu di-shoot ulang atau pakai clip lain.', 17, 'comment', false],
    ['ct_1024', 'james', 'Setuju. Tambahkan disclaimer di frame data supaya aman secara klaim.', null, 'comment', false],
    ['ct_1024', 'raka', 'Sudah di-upload versi 3 dengan opening baru.', null, 'comment', true],
    ['ct_1029', 'krisda', 'Tambahkan grafik tegangan di 1:20 supaya klaim lebih keras ada buktinya.', 80, 'change_request', false],
    ['ct_1031', 'budi', 'Approved. Caption looks good.', null, 'approval', true],
    ['ct_1059', 'budi', 'Klaim paling murah tidak boleh dipakai. Ganti dengan harga kompetitif.', null, 'change_request', false],
  ]
  for (const [i, [contentId, author, body, ts, kind, resolved]] of COMMENTS.entries()) {
    await database.insert(schema.comments).values({
      id: `cm_seed_${i}`,
      contentId,
      authorId: userIds[author]!,
      body,
      timestampSec: ts,
      kind,
      resolved,
      createdAt: at(-(i % 4), 10 + i),
    })
  }
  await database.insert(schema.approvals).values({
    id: 'ap_seed_1',
    contentId: 'ct_1031',
    reviewerId: userIds.budi!,
    decision: 'approved',
    note: 'Looks good.',
    createdAt: at(-1, 9),
  })

  // 9. Analytics for published content.
  const published = CONTENTS.filter((c) => c.status === 'published')
  for (const [idx, c] of published.entries()) {
    for (const p of c.platforms ?? [c.type]) {
      const r = seeded(`${c.ref}-${p}`)
      const views = Math.round((8000 + r() * 180000) * (1 + (published.length - idx) / 12))
      const eng = 0.04 + r() * 0.08
      const capturedAt = at(c.published ?? -5, 12)
      await database.insert(schema.analytics).values({
        id: id('an'),
        workspaceId: wsIds['goocanan']!,
        contentId: `ct_${c.ref}`,
        platform: p,
        views,
        likes: Math.round(views * eng * 0.82),
        comments: Math.round(views * eng * 0.05),
        shares: Math.round(views * eng * 0.08),
        saves: Math.round(views * eng * 0.13),
        watchTimeMin: Math.round(views * (0.3 + r() * 0.9)),
        ctr: 0.02 + r() * 0.09,
        followersGained: Math.round(views * (0.004 + r() * 0.012)),
        capturedAt,
      })

      // Daily rollup so the dashboard series has real data.
      await database.insert(schema.analyticsDaily).values({
        id: id('ad'),
        workspaceId: wsIds['goocanan']!,
        date: capturedAt.toISOString().slice(0, 10),
        platform: p,
        contentId: `ct_${c.ref}`,
        views: Math.round(views / 3),
        likes: Math.round((views * eng * 0.82) / 3),
        comments: Math.round((views * eng * 0.05) / 3),
        shares: Math.round((views * eng * 0.08) / 3),
        saves: Math.round((views * eng * 0.13) / 3),
        followersGained: Math.round((views * (0.004 + r() * 0.012)) / 3),
      })
    }
  }

  // 10. Ideas.
  for (const [i, row] of IDEAS.entries()) {
    await database.insert(schema.ideas).values({
      id: `id_seed_${i + 1}`,
      workspaceId: wsIds['goocanan']!,
      title: row[0],
      description: row[1],
      reference: '',
      platform: row[2],
      tags: [row[3]],
      priority: row[4],
      createdBy: userIds[['nadia', 'raka', 'krisda'][i % 3]!]!,
      votes: [12, 8, 5, 19, 14, 3, 7, 11, 4, 16][i]!,
      createdAt: at(-(i + 1), 11),
    })
  }

  // 11. Hashtags.
  for (const [i, row] of HASHTAGS.entries()) {
    await database.insert(schema.hashtags).values({
      id: `hs_seed_${i + 1}`,
      workspaceId: wsIds['goocanan']!,
      tag: `#${row[0]}`,
      usage: row[1],
      reach: row[2],
      engagement: row[3],
    })
  }

  // 12. Notifications for James.
  const NOTIFS: [string, string, string][] = [
    ['task', 'Content #1024 deadline besok', 'Testing Bambu A1 Mini - 7 hari nonstop. Assignee: Raka.'],
    ['approval', 'Content #1024 needs approval', 'Raka mengirim versi 3 untuk review.'],
    ['approval', 'Content #1059 needs approval', 'Promo akhir tahun menunggu persetujuan Budi.'],
    ['schedule', 'Content terjadwal besok 19:00', 'Unboxing filament GOOCANAN 3D ke Instagram Post.'],
    ['publish', 'Content berhasil dipublikasikan', '3 kesalahan nozzle printing tayang di 3 platform.'],
  ]
  for (const [i, n] of NOTIFS.entries()) {
    await database.insert(schema.notifications).values({
      id: `n_seed_${i}`,
      workspaceId: wsIds['goocanan']!,
      userId: userIds.james!,
      kind: n[0] as never,
      title: n[1],
      body: n[2],
      href: i < 3 ? '/content/ct_1024' : '/analytics',
      read: i >= 3,
      createdAt: at(-(i % 3), 8 + i),
    })
  }

  // 13. Activity log.
  const ACTIVITY: [string, string, string, string, 'create' | 'edit' | 'assign' | 'upload' | 'review' | 'publish' | 'delete'][] = [
    ['james', 'created Content #1024', 'Content #1024', 'ct_1024', 'create'],
    ['james', 'assigned Content #1024 to Raka', 'Content #1024', 'ct_1024', 'assign'],
    ['raka', 'uploaded video_v3.mp4', 'Asset', 'as_seed_1', 'upload'],
    ['budi', 'requested changes on Content #1024', 'Content #1024', 'ct_1024', 'review'],
    ['krisda', 'approved Content #1031', 'Content #1031', 'ct_1031', 'review'],
    ['james', 'published Content #1042', 'Content #1042', 'ct_1042', 'publish'],
  ]
  for (const [i, a] of ACTIVITY.entries()) {
    await logActivity({
      workspaceId: wsIds['goocanan']!,
      actorId: userIds[a[0]]!,
      verb: a[1],
      target: a[2],
      targetId: a[3],
      kind: a[4],
    })
    void i
  }

  // 14. Platform accounts.
  const ACCOUNTS: [PlatformId, string, boolean, number][] = [
    ['instagram_reel', '@goocanan3d', true, 48300],
    ['tiktok', '@goocanan3d', true, 132400],
    ['youtube', 'GOOCANAN 3D', true, 21700],
    ['linkedin', 'goocanan3d', false, 0],
    ['facebook_post', 'GOOCANAN 3D', false, 0],
  ]
  for (const [platform, handle, connected, followers] of ACCOUNTS) {
    await database.insert(schema.platformAccounts).values({
      id: id('pa'),
      workspaceId: wsIds['goocanan']!,
      platform,
      handle,
      connected,
      followers,
    })
  }

  return {
    seeded: true,
    users: Object.keys(userIds).length,
    content: contentIds.length,
    assets: assetIds.length,
    login: { email: 'james@goocanan3d.com', password: DEMO_PASSWORD },
  }
}

/** Tiny 1x1 transparent PNG. */
const PLACEHOLDER =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

// Run directly: npm run seed
if (process.argv[1]?.endsWith('seed.ts')) {
  const result = await maybeSeed(process.argv.includes('--force'))
  console.log(result)
  process.exit(0)
}
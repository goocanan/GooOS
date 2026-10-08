import type { PlatformId } from './types'

/**
 * Static reference data that is not workspace-scoped, so it lives in the client
 * rather than the database: the pricing table (PRD section 43) and the list of
 * publishable platforms (PRD section 26).
 *
 * Everything else now comes from the API.
 */

export const billingPlans = [
  {
    id: 'free',
    name: 'Free',
    price: 'Rp0',
    period: 'selamanya',
    features: ['1 workspace', '1 user', '30 konten', '1 GB storage', 'Basic calendar'],
    current: false,
  },
  {
    id: 'creator',
    name: 'Creator',
    price: 'Rp75K',
    period: '/bulan',
    features: ['3 workspace', '2 user', 'Unlimited konten', '10 GB storage', 'AI credits'],
    current: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'Rp199K',
    period: '/bulan',
    features: ['10 user', '50 GB storage', 'AI Studio', 'Analytics', 'Approval dan scheduling'],
    current: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 'Rp499K+',
    period: '/bulan',
    features: ['Unlimited client', 'Client portal', 'Advanced analytics', 'API', 'White label'],
    current: false,
  },
]

/** Platform accounts connected on the server, mirrored for the settings table. */
export const platformAccounts: {
  id: string
  platform: PlatformId
  handle: string
  /** Account kind on the platform, e.g. Business / Channel / Page. */
  accountType: string
  connected: boolean
  followers: number
}[] = [
  { id: 'pa_1', platform: 'instagram_reel', handle: '@goocanan3d', accountType: 'Business', connected: true, followers: 48_300 },
  { id: 'pa_2', platform: 'tiktok', handle: '@goocanan3d', accountType: 'Business', connected: true, followers: 132_400 },
  { id: 'pa_3', platform: 'youtube', handle: 'GOOCANAN 3D', accountType: 'Channel', connected: true, followers: 21_700 },
  { id: 'pa_4', platform: 'linkedin', handle: 'goocanan3d', accountType: 'Page', connected: false, followers: 0 },
  { id: 'pa_5', platform: 'facebook_post', handle: 'GOOCANAN 3D', accountType: 'Page', connected: false, followers: 0 },
]
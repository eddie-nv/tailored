// Portal group definitions — mirrors apps/web/app/components/config/portals.ts
// Kept here to avoid a cross-package dependency on the web app.

export type KnownPlatform = 'Ashby' | 'Greenhouse' | 'Lever'
export type DetectedPlatform = KnownPlatform | 'Unknown'

export function detectPlatformFromUrl(url: string): DetectedPlatform {
  try {
    const { hostname } = new URL(url)
    if (hostname === 'jobs.ashbyhq.com') return 'Ashby'
    if (hostname === 'boards.greenhouse.io' || hostname === 'job-boards.greenhouse.io') return 'Greenhouse'
    if (hostname === 'jobs.lever.co') return 'Lever'
    if (hostname.includes('ashby')) return 'Ashby'
    if (hostname.includes('greenhouse')) return 'Greenhouse'
    if (hostname.includes('lever')) return 'Lever'
    return 'Unknown'
  } catch {
    return 'Unknown'
  }
}

export function extractSlugFromUrl(url: string): string | null {
  try {
    const segments = new URL(url).pathname.split('/').filter(Boolean)
    return segments[0] ?? null
  } catch {
    return null
  }
}

export interface Portal {
  key: string
  label: string
}

export interface PortalGroup {
  name: string
  portals: Portal[]
}

export const PORTAL_GROUPS: PortalGroup[] = [
  {
    name: 'Ashby',
    portals: [
      { key: 'ashby-linear', label: 'Linear' },
      { key: 'ashby-figma', label: 'Figma' },
      { key: 'ashby-notion', label: 'Notion' },
      { key: 'ashby-vercel', label: 'Vercel' },
      { key: 'ashby-railway', label: 'Railway' },
      { key: 'ashby-loom', label: 'Loom' },
      { key: 'ashby-retool', label: 'Retool' },
      { key: 'ashby-descript', label: 'Descript' },
      { key: 'ashby-runway', label: 'Runway' },
      { key: 'ashby-pitch', label: 'Pitch' },
    ],
  },
  {
    name: 'Greenhouse',
    portals: [
      { key: 'greenhouse-airbnb', label: 'Airbnb' },
      { key: 'greenhouse-spotify', label: 'Spotify' },
      { key: 'greenhouse-dropbox', label: 'Dropbox' },
      { key: 'greenhouse-hubspot', label: 'HubSpot' },
      { key: 'greenhouse-zendesk', label: 'Zendesk' },
      { key: 'greenhouse-twilio', label: 'Twilio' },
      { key: 'greenhouse-cloudflare', label: 'Cloudflare' },
      { key: 'greenhouse-brex', label: 'Brex' },
      { key: 'greenhouse-gusto', label: 'Gusto' },
      { key: 'greenhouse-rippling', label: 'Rippling' },
      { key: 'greenhouse-intercom', label: 'Intercom' },
      { key: 'greenhouse-segment', label: 'Segment' },
    ],
  },
  {
    name: 'Lever',
    portals: [
      { key: 'lever-shopify', label: 'Shopify' },
      { key: 'lever-webflow', label: 'Webflow' },
      { key: 'lever-airtable', label: 'Airtable' },
      { key: 'lever-lattice', label: 'Lattice' },
      { key: 'lever-amplitude', label: 'Amplitude' },
      { key: 'lever-monday', label: 'Monday.com' },
      { key: 'lever-remote', label: 'Remote.com' },
      { key: 'lever-contentful', label: 'Contentful' },
    ],
  },
  {
    name: 'Wellfound',
    portals: [
      { key: 'wellfound-main', label: 'Wellfound' },
      { key: 'wellfound-contra', label: 'Contra' },
      { key: 'wellfound-hired', label: 'Hired' },
      { key: 'wellfound-underdog', label: 'Underdog.io' },
      { key: 'wellfound-arc', label: 'Arc.dev' },
    ],
  },
  {
    name: 'Workable',
    portals: [
      { key: 'workable-zapier', label: 'Zapier' },
      { key: 'workable-buffer', label: 'Buffer' },
      { key: 'workable-miro', label: 'Miro' },
      { key: 'workable-canva', label: 'Canva' },
      { key: 'workable-helpscout', label: 'Help Scout' },
    ],
  },
  {
    name: 'RemoteFront',
    portals: [
      { key: 'remote-weworkremotely', label: 'We Work Remotely' },
      { key: 'remote-remoteok', label: 'Remote OK' },
      { key: 'remote-remoteco', label: 'Remote.co' },
      { key: 'remote-flexjobs', label: 'FlexJobs' },
      { key: 'remote-remotive', label: 'Remotive' },
    ],
  },
]

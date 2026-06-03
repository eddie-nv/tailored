export type PortalProvider = 'Ashby' | 'Greenhouse' | 'Lever' | 'Workable' | 'Unknown'

export function detectPortalProvider(url: string): PortalProvider {
  try {
    const { hostname, pathname } = new URL(url)
    if (hostname === 'jobs.ashbyhq.com') return 'Ashby'
    if (hostname === 'boards.greenhouse.io' || hostname === 'job-boards.greenhouse.io') return 'Greenhouse'
    if (hostname === 'jobs.lever.co') return 'Lever'
    if (hostname === 'apply.workable.com') return 'Workable'
    if (pathname.includes('greenhouse') || hostname.includes('greenhouse')) return 'Greenhouse'
    if (pathname.includes('ashby') || hostname.includes('ashby')) return 'Ashby'
    if (pathname.includes('lever') || hostname.includes('lever')) return 'Lever'
    if (pathname.includes('workable') || hostname.includes('workable')) return 'Workable'
    return 'Unknown'
  } catch {
    return 'Unknown'
  }
}

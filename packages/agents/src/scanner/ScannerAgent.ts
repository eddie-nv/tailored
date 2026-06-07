import { EventType } from '@ag-ui/core'
import type { RunAgentInput, BaseEvent } from '@ag-ui/core'
import { prisma } from '@tailored/db/client'
import { BaseAgent } from '../shared/base-agent'
import { loadAppState } from '../shared/state'
import { randomUUID } from 'crypto'
import { PORTAL_GROUPS, detectPlatformFromUrl, extractSlugFromUrl } from './portals'
import {
  matchesTitleFilter,
  isSeniorityBoosted,
  matchesLocationFilter,
  parseTitleFilter,
  parseLocationFilter,
} from './filters'
import type { StoredTitleFilter, StoredLocationFilter } from './filters'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScannedJob {
  company: string
  role: string
  url: string
  location?: string
}

interface PlatformBatch {
  platformName: string
  portals: Array<{ key: string; slug: string }>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeParseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function stepStarted(stepName: string): BaseEvent {
  return { type: EventType.STEP_STARTED, stepName } as BaseEvent
}

function stepFinished(stepName: string): BaseEvent {
  return { type: EventType.STEP_FINISHED, stepName } as BaseEvent
}

function customEvent(name: string, value: unknown): BaseEvent {
  return { type: EventType.CUSTOM, name, value } as BaseEvent
}

function matchesKeywords(title: string, keywords: string[]): boolean {
  if (keywords.length === 0) return true
  const lower = title.toLowerCase()
  return keywords.some((kw) => lower.includes(kw.toLowerCase()))
}


// ── Platform Fetchers ─────────────────────────────────────────────────────────

interface AshbyPosting {
  title: string
  teamName?: string
  locationName?: string
  externalLink?: string
}

interface AshbyResponse {
  jobPostings?: AshbyPosting[]
}

async function fetchAshby(slug: string, signal: AbortSignal): Promise<ScannedJob[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}`
  const res = await fetch(url, { signal })
  if (!res.ok) return []
  const data = (await res.json()) as AshbyResponse
  return (data.jobPostings ?? []).map((p) => ({
    company: slug,
    role: p.title,
    url: p.externalLink ?? `https://jobs.ashbyhq.com/${slug}`,
    location: p.locationName,
  }))
}

interface GreenhouseJob {
  title: string
  id: number
  location?: { name: string }
  absolute_url?: string
}

interface GreenhouseResponse {
  jobs?: GreenhouseJob[]
}

async function fetchGreenhouse(slug: string, signal: AbortSignal): Promise<ScannedJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`
  const res = await fetch(url, { signal })
  if (!res.ok) return []
  const data = (await res.json()) as GreenhouseResponse
  return (data.jobs ?? []).map((j) => ({
    company: slug,
    role: j.title,
    url: j.absolute_url ?? `https://boards.greenhouse.io/${slug}/jobs/${j.id}`,
    location: j.location?.name,
  }))
}

interface LeverPosting {
  text: string
  categories?: { location?: string }
  hostedUrl?: string
}

async function fetchLever(slug: string, signal: AbortSignal): Promise<ScannedJob[]> {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`
  const res = await fetch(url, { signal })
  if (!res.ok) return []
  const data = (await res.json()) as LeverPosting[]
  if (!Array.isArray(data)) return []
  return data.map((p) => ({
    company: slug,
    role: p.text,
    url: p.hostedUrl ?? `https://jobs.lever.co/${slug}`,
    location: p.categories?.location,
  }))
}

// ── Platform Batch Builder ────────────────────────────────────────────────────

// Platforms with a supported public API that the scanner can query.
const SCANNABLE_PLATFORM_KEYS = new Set(['ashby', 'greenhouse', 'lever'])

export function buildPlatformBatches(enabledPortalKeys: string[]): PlatformBatch[] {
  const batches: Map<string, PlatformBatch> = new Map()

  for (const group of PORTAL_GROUPS) {
    const platformKey = group.name.toLowerCase()
    // Platform-level key ("ashby") expands to all portals in that group.
    const platformEnabled =
      SCANNABLE_PLATFORM_KEYS.has(platformKey) && enabledPortalKeys.includes(platformKey)

    for (const portal of group.portals) {
      if (!platformEnabled && !enabledPortalKeys.includes(portal.key)) continue

      const slug = portal.key.replace(/^[^-]+-/, '')
      const existing = batches.get(group.name)

      if (existing) {
        // De-dupe: skip if this portal was already added via a platform-level key.
        if (!existing.portals.some((p) => p.key === portal.key)) {
          existing.portals.push({ key: portal.key, slug })
        }
      } else {
        batches.set(group.name, {
          platformName: group.name,
          portals: [{ key: portal.key, slug }],
        })
      }
    }
  }

  return Array.from(batches.values())
}

// ── Scan one platform batch ────────────────────────────────────────────────────

async function scanPlatformBatch(
  batch: PlatformBatch,
  existingUrls: Set<string>,
  keywords: string[],
  titleFilter: StoredTitleFilter,
  locationFilter: StoredLocationFilter,
  signal: AbortSignal,
): Promise<ScannedJob[]> {
  const platformName = batch.platformName.toLowerCase()
  const collected: ScannedJob[] = []
  const positive = [...titleFilter.derived, ...titleFilter.custom]

  for (const { slug } of batch.portals) {
    if (signal.aborted) break

    let jobs: ScannedJob[] = []

    try {
      if (platformName === 'ashby') {
        jobs = await fetchAshby(slug, signal)
      } else if (platformName === 'greenhouse') {
        jobs = await fetchGreenhouse(slug, signal)
      } else if (platformName === 'lever') {
        jobs = await fetchLever(slug, signal)
      }
      // Workable, Wellfound, RemoteFront — skip (no clean public API)
    } catch {
      // Partial scan OK — continue to next portal
    }

    const filtered = jobs.filter(
      (j) =>
        matchesKeywords(j.role, keywords) &&
        matchesTitleFilter(j.role, positive, titleFilter.negative) &&
        matchesLocationFilter(j.location, locationFilter) &&
        !existingUrls.has(j.url),
    )

    for (const job of filtered) {
      existingUrls.add(job.url)
      collected.push(job)
    }
  }

  return collected
}

// ── Custom Portal Batch Builder ───────────────────────────────────────────────

interface CustomPortalRecord {
  id: string
  name: string
  url: string
  enabled: boolean
}

function buildCustomBatches(portals: CustomPortalRecord[]): {
  scannable: PlatformBatch[]
  skipped: CustomPortalRecord[]
} {
  const batchMap = new Map<string, PlatformBatch>()
  const skipped: CustomPortalRecord[] = []

  for (const portal of portals) {
    const platform = detectPlatformFromUrl(portal.url)
    if (platform === 'Unknown') {
      skipped.push(portal)
      continue
    }
    const slug = extractSlugFromUrl(portal.url)
    if (!slug) {
      skipped.push(portal)
      continue
    }
    const key = `custom-${platform}`
    const existing = batchMap.get(key)
    if (existing) {
      existing.portals.push({ key: portal.id, slug })
    } else {
      batchMap.set(key, { platformName: platform, portals: [{ key: portal.id, slug }] })
    }
  }

  return { scannable: Array.from(batchMap.values()), skipped }
}

// ── Agent ─────────────────────────────────────────────────────────────────────

export class ScannerAgent extends BaseAgent {
  protected async *runSteps(
    _input: RunAgentInput,
    signal: AbortSignal,
  ): AsyncGenerator<BaseEvent> {
    const appState = await loadAppState(prisma)
    const { discoveryPrefs, jobs: existingJobs } = appState

    const enabledPortalKeys = discoveryPrefs?.portals
      ? safeParseJson<string[]>(discoveryPrefs.portals, [])
      : []

    const keywords = discoveryPrefs?.keywords
      ? safeParseJson<string[]>(discoveryPrefs.keywords, [])
      : []

    const titleFilter = parseTitleFilter(discoveryPrefs?.titleFilter ?? null)
    const locationFilter = parseLocationFilter(discoveryPrefs?.locationFilter ?? null)

    const rawCustomPortals = await prisma.customPortal.findMany({ where: { enabled: true } })
    const { scannable: customBatches, skipped: skippedPortals } = buildCustomBatches(rawCustomPortals)

    if (skippedPortals.length > 0) {
      yield customEvent('scan-progress-skipped', {
        portals: skippedPortals.map((p) => ({ name: p.name, url: p.url })),
        reason: 'No supported ATS detected for these URLs',
      })
    }

    const batches = [...buildPlatformBatches(enabledPortalKeys), ...customBatches]
    const total = batches.length

    // Emit init progress
    yield customEvent('scan-progress-init', { total, done: 0, found: 0 })

    const existingUrls = new Set(existingJobs.map((j) => j.url).filter(Boolean) as string[])
    const allNewJobs: ScannedJob[] = []
    let done = 0

    for (const batch of batches) {
      if (signal.aborted) break

      yield stepStarted(`scanning-${batch.platformName}`)

      const found = await scanPlatformBatch(batch, existingUrls, keywords, titleFilter, locationFilter, signal)
      allNewJobs.push(...found)
      done += 1

      yield customEvent('scan-progress-update', {
        done,
        found: allNewJobs.length,
        platform: batch.platformName,
      })

      yield stepFinished(`scanning-${batch.platformName}`)
    }

    // Sort seniority-boosted jobs first so they appear at the top of the results
    allNewJobs.sort((a, b) => {
      const aBoost = isSeniorityBoosted(a.role, titleFilter.seniorityBoost) ? 0 : 1
      const bBoost = isSeniorityBoosted(b.role, titleFilter.seniorityBoost) ? 0 : 1
      return aBoost - bBoost
    })

    // DB write in one shot
    const jobsToInsert = allNewJobs.map((j) => ({
      id: randomUUID(),
      company: j.company,
      role: j.role,
      url: j.url,
      source: 'scan' as const,
      status: 'new',
    }))

    if (jobsToInsert.length > 0) {
      await prisma.job.createMany({ data: jobsToInsert })
    }

    // Emit STATE_DELTA for all new jobs
    if (jobsToInsert.length > 0) {
      const deltaOps = jobsToInsert.map((j) => ({
        op: 'add' as const,
        path: '/jobs/-',
        value: {
          ...j,
          archetype: null,
          score: null,
          cvMatchPct: null,
          evalReport: null,
          notes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          resumes: [],
        },
      }))

      yield { type: EventType.STATE_DELTA, delta: deltaOps } as BaseEvent
    }

    // RUN_FINISHED with interrupt carrying new job metadata
    const newJobsMeta = jobsToInsert.map((j) => ({
      id: j.id,
      company: j.company,
      role: j.role,
      url: j.url,
    }))

    this.runOutcome = {
      type: 'interrupt',
      interrupts: [
        {
          id: randomUUID(),
          reason: 'select-jobs-to-evaluate',
          message:
            newJobsMeta.length > 0
              ? `Scan complete. Found ${newJobsMeta.length} new job${newJobsMeta.length === 1 ? '' : 's'}. Select jobs to evaluate.`
              : 'Scan complete. No new jobs found matching your filters.',
          metadata: { newJobs: newJobsMeta },
        },
      ],
    }
  }
}

export type QueryPreset = {
  name: string
  query: string
  category: 'AI/ML' | 'DevRel / SA / FDE' | 'Automation' | 'Regional' | 'Boards'
}

export const QUERY_PRESETS: QueryPreset[] = [
  // AI/ML
  {
    category: 'AI/ML',
    name: 'Ashby — AI Engineer',
    query: 'site:jobs.ashbyhq.com "AI Engineer" OR "LLM Engineer" OR "Forward Deployed" remote',
  },
  {
    category: 'AI/ML',
    name: 'Greenhouse — AI Engineer',
    query: 'site:job-boards.greenhouse.io "AI Engineer" OR "LLM" OR "Agentic" remote',
  },
  {
    category: 'AI/ML',
    name: 'YC Jobs — Applied AI',
    query: 'site:workatastartup.com "Applied AI" OR "AI Engineer" OR "AI Agent" remote',
  },

  // DevRel / SA / FDE
  {
    category: 'DevRel / SA / FDE',
    name: 'FDE — All portals',
    query:
      '"Forward Deployed Engineer" OR "Deployed Engineer" AI site:job-boards.greenhouse.io OR site:jobs.ashbyhq.com OR site:jobs.lever.co',
  },
  {
    category: 'DevRel / SA / FDE',
    name: 'Ashby — Solutions Architect',
    query: 'site:jobs.ashbyhq.com "Solutions Architect" AI OR automation remote',
  },
  {
    category: 'DevRel / SA / FDE',
    name: 'DevRelX Jobs',
    query: 'site:devrelx.com/jobs remote',
  },

  // Automation
  {
    category: 'Automation',
    name: 'GTM Engineer — All portals',
    query: '"GTM Engineer" OR "RevOps Engineer" automation Airtable OR Make OR Clay remote',
  },
  {
    category: 'Automation',
    name: 'Ashby — No-Code & Automation',
    query: 'site:jobs.ashbyhq.com "no-code" OR "low-code" OR "automation engineer" remote senior',
  },

  // Regional
  {
    category: 'Regional',
    name: 'Remotive — AI/SA/FDE Europe',
    query:
      'site:remotive.com "AI Engineer" OR "Solutions Architect" OR "Forward Deployed" Europe',
  },
  {
    category: 'Regional',
    name: "HN Who's Hiring — Remote AI",
    query:
      'site:news.ycombinator.com "AI Engineer" OR "Forward Deployed" OR "Founding Engineer" remote',
  },

  // Boards
  {
    category: 'Boards',
    name: 'ai-jobs.net — DevRel/SA',
    query:
      'site:ai-jobs.net "Developer Advocate" OR "Solutions Architect" OR "Forward Deployed" remote',
  },
  {
    category: 'Boards',
    name: 'Himalayas — AI/Dev-tools',
    query:
      'site:himalayas.app "AI Engineer" OR "Solutions Architect" OR "Forward Deployed" Europe',
  },
]

export const PRESET_CATEGORIES: QueryPreset['category'][] = [
  'AI/ML',
  'DevRel / SA / FDE',
  'Automation',
  'Regional',
  'Boards',
]

interface TableJob {
  id: string
  company: string
  role: string
  score?: string | null
  status: string
  createdAt: Date | string
}

function trunc(s: string, max: number): string {
  if (s.length <= max) return s.padEnd(max)
  return s.slice(0, max - 1) + '…'
}

function formatDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d)
  return date.toISOString().slice(0, 10)
}

const COL = { id: 8, company: 20, role: 30, score: 5, status: 10 }

export function formatJobTable(jobs: TableJob[]): string {
  const header =
    trunc('ID', COL.id) +
    '  ' +
    trunc('Company', COL.company) +
    '  ' +
    trunc('Role', COL.role) +
    '  ' +
    'Score'.padStart(COL.score) +
    '  ' +
    trunc('Status', COL.status) +
    '  ' +
    'Created'

  const sep = '─'.repeat(header.length)

  const rows = jobs.map((j) => {
    const scoreStr = j.score != null ? String(j.score) : '–'
    return (
      trunc(j.id, COL.id) +
      '  ' +
      trunc(j.company, COL.company) +
      '  ' +
      trunc(j.role, COL.role) +
      '  ' +
      scoreStr.padStart(COL.score) +
      '  ' +
      trunc(j.status, COL.status) +
      '  ' +
      formatDate(j.createdAt)
    )
  })

  return [header, sep, ...rows].join('\n')
}

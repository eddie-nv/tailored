export const SCORE_STYLES: Record<string, string> = {
  A:   'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/30',
  'B+': 'bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/30',
  B:   'bg-blue-500/8 text-blue-500 ring-1 ring-blue-500/20',
  C:   'bg-yellow-500/10 text-yellow-600 ring-1 ring-yellow-500/20',
  D:   'bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/20',
  F:   'bg-red-500/10 text-red-600 ring-1 ring-red-500/20',
}

export function scoreStyle(score: string): string {
  return SCORE_STYLES[score] ?? SCORE_STYLES['C']!
}

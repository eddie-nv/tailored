import type { CSSProperties } from 'react'

const BADGE_BASE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 4,
  padding: '2px 8px',
  fontSize: '0.75rem',
  fontWeight: 600,
}

export const SCORE_STYLES: Record<string, CSSProperties> = {
  A:   { background: 'rgba(16, 185, 129, 0.1)', color: '#059669', boxShadow: '0 0 0 1px rgba(16, 185, 129, 0.3)' },
  'B+': { background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.3)' },
  B:   { background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.2)' },
  C:   { background: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04', boxShadow: '0 0 0 1px rgba(234, 179, 8, 0.2)' },
  D:   { background: 'rgba(249, 115, 22, 0.1)', color: '#ea580c', boxShadow: '0 0 0 1px rgba(249, 115, 22, 0.2)' },
  F:   { background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', boxShadow: '0 0 0 1px rgba(239, 68, 68, 0.2)' },
}

export function scoreStyle(score: string): CSSProperties {
  return { ...BADGE_BASE, ...(SCORE_STYLES[score] ?? SCORE_STYLES['C']!) }
}

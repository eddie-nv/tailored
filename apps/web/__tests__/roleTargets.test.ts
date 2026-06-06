import { describe, it, expect } from 'vitest'
import {
  isRoleComplete,
  computeDerivedTitles,
  serializeRoleTargets,
} from '../app/lib/roleTargets'
import type { RoleTarget } from '../app/lib/roleTargets'

const role = (overrides: Partial<RoleTarget>): RoleTarget => ({
  title: '',
  priority: 'primary',
  seniority: '',
  ...overrides,
})

describe('isRoleComplete', () => {
  it('returns false for empty title', () => {
    expect(isRoleComplete(role({ title: '' }))).toBe(false)
  })

  it('returns false for whitespace-only title', () => {
    expect(isRoleComplete(role({ title: '   ' }))).toBe(false)
  })

  it('returns true for a non-empty title', () => {
    expect(isRoleComplete(role({ title: 'Staff Engineer' }))).toBe(true)
  })

  it('returns true even when seniority is empty', () => {
    expect(isRoleComplete(role({ title: 'Manager', seniority: '' }))).toBe(true)
  })

  it('returns true for backup and stretch priorities', () => {
    expect(isRoleComplete(role({ title: 'EM', priority: 'backup' }))).toBe(true)
    expect(isRoleComplete(role({ title: 'Director', priority: 'stretch' }))).toBe(true)
  })
})

describe('computeDerivedTitles', () => {
  it('returns titles of primary roles with non-empty titles', () => {
    const roles: RoleTarget[] = [
      role({ title: 'Staff Engineer', priority: 'primary' }),
      role({ title: 'Principal Engineer', priority: 'primary' }),
    ]
    expect(computeDerivedTitles(roles)).toEqual(['Staff Engineer', 'Principal Engineer'])
  })

  it('excludes backup and stretch roles', () => {
    const roles: RoleTarget[] = [
      role({ title: 'Staff Engineer', priority: 'primary' }),
      role({ title: 'Engineering Manager', priority: 'backup' }),
      role({ title: 'Director', priority: 'stretch' }),
    ]
    expect(computeDerivedTitles(roles)).toEqual(['Staff Engineer'])
  })

  it('excludes primary roles with empty titles', () => {
    const roles: RoleTarget[] = [
      role({ title: '', priority: 'primary' }),
      role({ title: 'Staff Engineer', priority: 'primary' }),
    ]
    expect(computeDerivedTitles(roles)).toEqual(['Staff Engineer'])
  })

  it('trims whitespace from titles', () => {
    const roles: RoleTarget[] = [role({ title: '  Staff Engineer  ', priority: 'primary' })]
    expect(computeDerivedTitles(roles)).toEqual(['Staff Engineer'])
  })

  it('returns empty array for an empty input', () => {
    expect(computeDerivedTitles([])).toEqual([])
  })

  it('returns empty array when no primary roles have a title', () => {
    const roles: RoleTarget[] = [
      role({ title: '', priority: 'primary' }),
      role({ title: 'EM', priority: 'backup' }),
    ]
    expect(computeDerivedTitles(roles)).toEqual([])
  })
})

describe('serializeRoleTargets', () => {
  it('returns null for an empty array', () => {
    expect(serializeRoleTargets([])).toBeNull()
  })

  it('returns null when all roles have empty titles', () => {
    expect(serializeRoleTargets([role({ title: '' }), role({ title: '  ' })])).toBeNull()
  })

  it('excludes roles with empty titles', () => {
    const roles: RoleTarget[] = [
      role({ title: '' }),
      role({ title: 'Staff Engineer', seniority: 'Senior' }),
    ]
    expect(serializeRoleTargets(roles)).toEqual([
      { title: 'Staff Engineer', priority: 'primary', seniority: 'Senior' },
    ])
  })

  it('preserves complete roles across all priorities', () => {
    const roles: RoleTarget[] = [
      role({ title: 'Staff Engineer', priority: 'primary', seniority: 'Senior' }),
      role({ title: 'EM', priority: 'backup', seniority: '' }),
      role({ title: 'Director', priority: 'stretch', seniority: '' }),
    ]
    const result = serializeRoleTargets(roles)
    expect(result).toHaveLength(3)
    expect(result).toEqual(roles)
  })

  it('filters incomplete roles from a mixed list', () => {
    const roles: RoleTarget[] = [
      role({ title: 'Staff Engineer', priority: 'primary' }),
      role({ title: '' }),
      role({ title: 'EM', priority: 'backup' }),
      role({ title: '   ' }),
    ]
    const result = serializeRoleTargets(roles)
    expect(result).toHaveLength(2)
    expect(result![0].title).toBe('Staff Engineer')
    expect(result![1].title).toBe('EM')
  })
})

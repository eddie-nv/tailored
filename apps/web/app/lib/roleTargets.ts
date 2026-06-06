export type RoleTarget = {
  title: string
  priority: 'primary' | 'backup' | 'stretch'
  seniority: string
}

export function isRoleComplete(role: RoleTarget): boolean {
  return role.title.trim().length > 0
}

export function computeDerivedTitles(roles: RoleTarget[]): string[] {
  return roles
    .filter((r) => r.priority === 'primary' && r.title.trim().length > 0)
    .map((r) => r.title.trim())
}

export function serializeRoleTargets(roles: RoleTarget[]): RoleTarget[] | null {
  const complete = roles.filter(isRoleComplete)
  return complete.length > 0 ? complete : null
}

import { Paper, Text } from '@mantine/core'

export function IdentityTile() {
  return (
    <Paper withBorder p="lg" style={{ gridColumn: 'span 4' }} className="bento-tile">
      <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="dimmed" mb="md">
        Identity
      </Text>
      {/* form fields added in M3 */}
    </Paper>
  )
}

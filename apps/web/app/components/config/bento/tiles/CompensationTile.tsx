import { Paper, Text } from '@mantine/core'

export function CompensationTile() {
  return (
    <Paper withBorder p="lg" style={{ gridColumn: 'span 4' }} className="bento-tile">
      <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="dimmed" mb="md">
        Compensation
      </Text>
      {/* form fields added in M4 */}
    </Paper>
  )
}

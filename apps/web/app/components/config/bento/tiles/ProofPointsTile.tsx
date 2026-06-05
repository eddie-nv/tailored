import { Paper, Text } from '@mantine/core'

export function ProofPointsTile() {
  return (
    <Paper withBorder p="lg" style={{ gridColumn: 'span 8' }} className="bento-tile">
      <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="dimmed" mb="md">
        Proof Points
      </Text>
      {/* form fields added in M6 */}
    </Paper>
  )
}

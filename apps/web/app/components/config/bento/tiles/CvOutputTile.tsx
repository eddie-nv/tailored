import { Paper, Text } from '@mantine/core'

export function CvOutputTile() {
  return (
    <Paper withBorder p="lg" style={{ gridColumn: 'span 6' }} className="bento-tile">
      <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="dimmed" mb="md">
        CV Output
      </Text>
      {/* form fields added in M5 */}
    </Paper>
  )
}

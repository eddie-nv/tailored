import { Paper, Text } from '@mantine/core'

export function PdfGateTile() {
  return (
    <Paper withBorder p="lg" style={{ gridColumn: 'span 4' }} className="bento-tile">
      <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="dimmed" mb="md">
        PDF Gate
      </Text>
      {/* form fields added in M4 */}
    </Paper>
  )
}

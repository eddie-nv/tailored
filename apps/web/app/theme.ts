import { createTheme, type MantineColorsTuple } from '@mantine/core'

const brand: MantineColorsTuple = [
  '#fff0f3',
  '#ffd6de',
  '#ffb3bf',
  '#ff8599',
  '#ff638a',
  '#ff4a71',
  '#FF385C',
  '#e8294e',
  '#cc1f3f',
  '#b01533',
]

export const theme = createTheme({
  primaryColor: 'brand',
  colors: { brand },
  defaultRadius: 'sm',
  fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
  fontFamilyMonospace: 'var(--font-geist-mono), monospace',
})

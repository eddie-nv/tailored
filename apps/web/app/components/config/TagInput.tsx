'use client'

import { TagsInput } from '@mantine/core'

type Props = {
  label: string
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  id?: string
  color?: string
}

export function TagInput({ label, value, onChange, placeholder = 'Type and press Enter', id, color }: Props) {
  return (
    <TagsInput
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      placeholder={value.length === 0 ? placeholder : ''}
      splitChars={[',']}
      color={color}
      styles={{
        label: {
          fontSize: '0.6875rem',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#a1a1aa',
          marginBottom: 8,
        },
      }}
    />
  )
}

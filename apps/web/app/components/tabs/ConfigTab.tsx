import { Stack } from '@mantine/core'
import { ProfileSection } from '../config/ProfileSection'
import { DiscoverySection } from '../config/DiscoverySection'
import { ResumeSection } from '../config/ResumeSection'

export function ConfigTab() {
  return (
    <Stack gap={0}>
      <ProfileSection />
      <DiscoverySection />
      <ResumeSection />
    </Stack>
  )
}

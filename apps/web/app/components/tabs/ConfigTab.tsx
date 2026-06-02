import { ProfileSection } from '../config/ProfileSection'
import { DiscoverySection } from '../config/DiscoverySection'
import { ResumeSection } from '../config/ResumeSection'

export function ConfigTab() {
  return (
    <div className="flex flex-col">
      <ProfileSection />
      <DiscoverySection />
      <ResumeSection />
    </div>
  )
}

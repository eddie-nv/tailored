import { IdentityTile } from './tiles/IdentityTile'
import { NarrativeTile } from './tiles/NarrativeTile'
import { TargetRolesTile } from './tiles/TargetRolesTile'
import { CompensationTile } from './tiles/CompensationTile'
import { WorkPrefsTile } from './tiles/WorkPrefsTile'
import { CvOutputTile } from './tiles/CvOutputTile'
import { DiscoveryTile } from './tiles/DiscoveryTile'
import { SearchFiltersTile } from './tiles/SearchFiltersTile'
import { ProofPointsTile } from './tiles/ProofPointsTile'
import { PdfGateTile } from './tiles/PdfGateTile'

export function ConfigBento() {
  return (
    <div className="bento-grid">
      <IdentityTile />
      <NarrativeTile />
      <TargetRolesTile />
      <SearchFiltersTile />
      <CompensationTile />
      <WorkPrefsTile />
      <CvOutputTile />
      <DiscoveryTile />
      <ProofPointsTile />
      <PdfGateTile />
    </div>
  )
}

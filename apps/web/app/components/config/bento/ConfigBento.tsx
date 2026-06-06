import { RoleTargetsProvider } from '../../../providers/RoleTargetsProvider'
import { IdentityTile } from './tiles/IdentityTile'
import { NarrativeTile } from './tiles/NarrativeTile'
import { TargetRolesTile } from './tiles/TargetRolesTile'
import { CompensationTile } from './tiles/CompensationTile'
import { WorkPrefsTile } from './tiles/WorkPrefsTile'
import { CvOutputTile } from './tiles/CvOutputTile'
import { DiscoveryTile } from './tiles/DiscoveryTile'
import { SearchFiltersTile } from './tiles/SearchFiltersTile'
import { LocationFilterTile } from './tiles/LocationFilterTile'
import { ProofPointsTile } from './tiles/ProofPointsTile'
import { PdfGateTile } from './tiles/PdfGateTile'

export function ConfigBento() {
  return (
    <RoleTargetsProvider>
      <div className="bento-grid">
        <IdentityTile />
        <NarrativeTile />
        <TargetRolesTile />
        <SearchFiltersTile />
        <LocationFilterTile />
        <CompensationTile />
        <WorkPrefsTile />
        <CvOutputTile />
        <DiscoveryTile />
        <ProofPointsTile />
        <PdfGateTile />
      </div>
    </RoleTargetsProvider>
  )
}

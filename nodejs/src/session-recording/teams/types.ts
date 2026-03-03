import { TeamForReplay } from '../../session-replay/shared/teams/types'
import { ParsedMessageData } from '../stream/types'

export type { TeamForReplay }

export interface MessageWithTeam {
    team: TeamForReplay
    message: ParsedMessageData
}

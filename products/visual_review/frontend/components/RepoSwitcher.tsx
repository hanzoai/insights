import { useValues } from 'kea'

import { IconChevronDown } from '@hanzo/icons'
import { Button } from '@hanzo/elements'

import { Menu } from 'lib/elements/Menu/Menu'

import type { RepoApi } from '../generated/api.schemas'
import { visualReviewRepoLogic } from '../scenes/visualReviewRepoLogic'
import type { VisualReviewTabKey } from './VisualReviewTabs'

interface RepoSwitcherProps {
    repoId: string
    // Where to land on the other repo — preserves the user's current tab so
    // switching from Snapshots on repo A goes to Snapshots on repo B.
    activeTab: VisualReviewTabKey
}

const TAB_TO_PATH: Record<VisualReviewTabKey, (repoId: string) => string> = {
    runs: (repoId) => `/visual_review/repos/${repoId}/runs`,
    snapshots: (repoId) => `/visual_review/repos/${repoId}/snapshots`,
}

export function RepoSwitcher({ repoId, activeTab }: RepoSwitcherProps): JSX.Element | null {
    const { repo, otherRepos } = useValues(visualReviewRepoLogic({ repoId }))

    if (otherRepos.length === 0) {
        return null
    }

    const items = otherRepos.map((r: RepoApi) => ({
        label: r.repo_full_name,
        to: TAB_TO_PATH[activeTab](r.id),
    }))

    return (
        <Menu items={items}>
            <Button type="secondary" size="small" sideIcon={<IconChevronDown />}>
                {repo?.repo_full_name ?? 'Switch repo'}
            </Button>
        </Menu>
    )
}

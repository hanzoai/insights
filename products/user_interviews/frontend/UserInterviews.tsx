import { useActions, useValues } from 'kea'

import { IconDownload } from '@hanzo/icons'
import { LemonButton, LemonTable, LemonTableColumn } from '@hanzo/lemon-ui'

import { ProductIntroduction } from 'lib/components/ProductIntroduction/ProductIntroduction'
import { PhonePairHogs } from 'lib/components/mascots'
import { LemonTableLink } from 'lib/lemon-ui/LemonTable/LemonTableLink'
import { createdAtColumn, createdByColumn } from 'lib/lemon-ui/LemonTable/columnUtils'
import { MaxTool } from 'scenes/max/MaxTool'
import { Scene, SceneExport } from 'scenes/sceneTypes'
import { sceneConfigurations } from 'scenes/scenes'
import { urls } from 'scenes/urls'
import { userLogic } from 'scenes/userLogic'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { ProductKey } from '~/queries/schema/schema-general'
import { UserInterviewType } from '~/types'

import { userInterviewsLogic } from './userInterviewsLogic'

export const scene: SceneExport = {
    component: UserInterviews,
    logic: userInterviewsLogic,
    productKey: ProductKey.USER_INTERVIEWS,
}

export function UserInterviews(): JSX.Element {
    const { userInterviews, userInterviewsLoading } = useValues(userInterviewsLogic)

    const { updateHasSeenProductIntroFor } = useActions(userLogic)
    return (
        <SceneContent>
            <SceneTitleSection
                name={sceneConfigurations[Scene.UserInterviews].name}
                description={sceneConfigurations[Scene.UserInterviews].description}
                resourceType={{
                    type: sceneConfigurations[Scene.UserInterviews].iconType || 'default_icon_type',
                }}
            />
            <ProductIntroduction
                productName="User interviews"
                productKey={ProductKey.USER_INTERVIEWS}
                thingName="user interview"
                description="Make full use of user interviews by recording them with Insights."
                customHog={PhonePairHogs}
                isEmpty={!userInterviewsLoading && userInterviews.length === 0}
                actionElementOverride={
                    <LemonButton
                        type="primary"
                        icon={<IconDownload />}
                        onClick={() => updateHasSeenProductIntroFor(ProductKey.USER_INTERVIEWS)}
                        to="https://hanzo.ai/recorder"
                        data-attr="install-recorder"
                    >
                        Install Insights Recorder
                    </LemonButton>
                }
                className="my-0"
            />
            <MaxTool identifier="analyze_user_interviews" context={{}}>
                <LemonTable
                    loading={userInterviewsLoading}
                    columns={[
                        {
                            title: 'Interviewees',
                            key: 'interviewees',
                            render: (_, row) => (
                                <LemonTableLink
                                    title={row.interviewee_emails.join(', ')}
                                    to={urls.userInterview(row.id)}
                                />
                            ),
                        },
                        createdAtColumn() as LemonTableColumn<UserInterviewType, keyof UserInterviewType | undefined>,
                        createdByColumn() as LemonTableColumn<UserInterviewType, keyof UserInterviewType | undefined>,
                    ]}
                    dataSource={userInterviews}
                    loadingSkeletonRows={5}
                />
            </MaxTool>
        </SceneContent>
    )
}

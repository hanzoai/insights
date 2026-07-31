import { useActions, useValues } from 'kea'

import { IconDownload } from '@hanzo/icons'
import { Button, Table, TableColumn } from '@hanzo/elements'

import { ProductIntroduction } from 'lib/components/ProductIntroduction/ProductIntroduction'
import { PhonePairMascots } from 'lib/components/mascots'
import { TableLink } from 'lib/elements/Table/TableLink'
import { createdAtColumn, createdByColumn } from 'lib/elements/Table/columnUtils'
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
                customInsights={PhonePairMascots}
                isEmpty={!userInterviewsLoading && userInterviews.length === 0}
                actionElementOverride={
                    <Button
                        type="primary"
                        icon={<IconDownload />}
                        onClick={() => updateHasSeenProductIntroFor(ProductKey.USER_INTERVIEWS)}
                        to="https://hanzo.ai/recorder"
                        data-attr="install-recorder"
                    >
                        Install Insights Recorder
                    </Button>
                }
                className="my-0"
            />
            <MaxTool identifier="analyze_user_interviews" context={{}}>
                <Table
                    loading={userInterviewsLoading}
                    columns={[
                        {
                            title: 'Interviewees',
                            key: 'interviewees',
                            render: (_, row) => (
                                <TableLink
                                    title={row.interviewee_emails.join(', ')}
                                    to={urls.userInterview(row.id)}
                                />
                            ),
                        },
                        createdAtColumn() as TableColumn<UserInterviewType, keyof UserInterviewType | undefined>,
                        createdByColumn() as TableColumn<UserInterviewType, keyof UserInterviewType | undefined>,
                    ]}
                    dataSource={userInterviews}
                    loadingSkeletonRows={5}
                />
            </MaxTool>
        </SceneContent>
    )
}

import { useActions, useValues } from 'kea'
import { router } from 'kea-router'
import { useMemo } from 'react'

import { Button, Dialog, Divider, Input, Select, Table, Spinner } from '@hanzo/elements'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { MemberSelect } from 'lib/components/MemberSelect'
import { Shortcut } from 'lib/components/Shortcuts/Shortcut'
import { keyBinds } from 'lib/components/Shortcuts/shortcuts'
import { dayjs } from 'lib/dayjs'
import { More } from 'lib/elements/Button/More'
import { TableColumn } from 'lib/elements/Table'
import { createdAtColumn } from 'lib/elements/Table/columnUtils'
import { TableLink } from 'lib/elements/Table/TableLink'
import { cn } from 'lib/utils/css-classes'
import stringWithWBR from 'lib/utils/stringWithWBR'
import { organizationLogic } from 'scenes/organizationLogic'
import { Scene } from 'scenes/sceneTypes'
import { SurveysEmptyState } from 'scenes/surveys/components/empty-state/SurveysEmptyState'
import { SdkVersionWarnings } from 'scenes/surveys/components/SdkVersionWarnings'
import { SurveyStatusTag } from 'scenes/surveys/components/SurveyStatusTag'
import { SURVEY_TYPE_LABEL_MAP, SurveyQuestionLabel } from 'scenes/surveys/constants'
import {
    canDeleteSurvey,
    openArchiveSurveyDialog,
    openDeleteSurveyDialog,
    openResumeSurveyDialog,
} from 'scenes/surveys/surveyDialogs'
import { SurveysTabs, surveysLogic } from 'scenes/surveys/surveysLogic'
import { getSurveyWarnings } from 'scenes/surveys/surveyVersionRequirements'
import { isSurveyRunning } from 'scenes/surveys/utils'
import { urls } from 'scenes/urls'

import { ProductIntentContext } from '~/queries/schema/schema-general'
import { AccessControlLevel, AccessControlResourceType, Survey, SurveyType } from '~/types'

export function SurveysTable(): JSX.Element {
    const {
        data: { surveys },
        searchedSurveys,
        dataLoading,
        surveysResponsesCount,
        surveysResponsesCountLoading,
        searchTerm,
        filters,
        tab,
        hasNextPage,
        hasNextSearchPage,
        teamSdkVersions,
    } = useValues(surveysLogic)
    const { currentOrganization } = useValues(organizationLogic)

    const {
        deleteSurvey,
        updateSurvey,
        setSearchTerm,
        setSurveysFilters,
        loadNextPage,
        loadNextSearchPage,
        duplicateSurvey,
        setSurveyToDuplicate,
    } = useActions(surveysLogic)

    const hasMultipleProjects = currentOrganization?.teams && currentOrganization.teams.length > 1

    // A fresh columns array every render defeats TableRow's React.memo, re-rendering all 100
    // rows of the table whenever anything in surveysLogic changes.
    const columns = useMemo<TableColumn<Survey, keyof Survey | undefined>[]>(
        () => [
            {
                dataIndex: 'name',
                title: 'Name',
                render: function RenderName(_, survey) {
                    return <TableLink to={urls.survey(survey.id)} title={stringWithWBR(survey.name, 17)} />
                },
            },
            {
                title: 'Responses',
                dataIndex: 'id',
                render: function RenderResponses(_, survey) {
                    return (
                        <>
                            {surveysResponsesCountLoading ? (
                                <Spinner />
                            ) : (
                                <div>{surveysResponsesCount[survey.id] ?? 0}</div>
                            )}
                        </>
                    )
                },
                sorter: (surveyA, surveyB) => {
                    const countA = surveysResponsesCount[surveyA.id] ?? 0
                    const countB = surveysResponsesCount[surveyB.id] ?? 0
                    return countA - countB
                },
            },
            {
                dataIndex: 'type',
                title: 'Mode',
                render: function RenderType(_, survey) {
                    return SURVEY_TYPE_LABEL_MAP[survey.type]
                },
            },
            {
                title: 'Question type',
                render: function RenderResponses(_, survey) {
                    return survey.questions?.length === 1 ? SurveyQuestionLabel[survey.questions[0].type] : 'Multiple'
                },
            },
            ...(tab === SurveysTabs.Active
                ? [
                      createdAtColumn<Survey>() as TableColumn<Survey, keyof Survey | undefined>,
                      {
                          title: 'Status',
                          width: 100,
                          render: function Render(_: any, survey: Survey) {
                              return <SurveyStatusTag survey={survey} />
                          },
                      },
                  ]
                : []),
            {
                width: 0,
                render: function Render(_, survey: Survey) {
                    return (
                        <More
                            overlay={
                                <>
                                    <Button fullWidth onClick={() => router.actions.push(urls.survey(survey.id))}>
                                        View
                                    </Button>
                                    <AccessControlAction
                                        resourceType={AccessControlResourceType.Survey}
                                        minAccessLevel={AccessControlLevel.Editor}
                                        userAccessLevel={survey.user_access_level}
                                    >
                                        <Button
                                            fullWidth
                                            onClick={() => {
                                                if (hasMultipleProjects) {
                                                    setSurveyToDuplicate(survey)
                                                } else {
                                                    duplicateSurvey(survey)
                                                }
                                            }}
                                        >
                                            Duplicate
                                        </Button>
                                    </AccessControlAction>
                                    {!survey.start_date && (
                                        <AccessControlAction
                                            resourceType={AccessControlResourceType.Survey}
                                            minAccessLevel={AccessControlLevel.Editor}
                                            userAccessLevel={survey.user_access_level}
                                        >
                                            <Button
                                                fullWidth
                                                onClick={() => {
                                                    const warnings = getSurveyWarnings(survey, teamSdkVersions)
                                                    Dialog.open({
                                                        title: 'Launch this survey?',
                                                        content: (
                                                            <div>
                                                                <div className="text-sm text-secondary">
                                                                    The survey will immediately start displaying to
                                                                    users matching the display conditions.
                                                                </div>
                                                                <SdkVersionWarnings warnings={warnings} />
                                                            </div>
                                                        ),
                                                        primaryButton: {
                                                            children: 'Launch',
                                                            type: 'primary',
                                                            onClick: () => {
                                                                updateSurvey({
                                                                    id: survey.id,
                                                                    updatePayload: {
                                                                        start_date: dayjs().toISOString(),
                                                                    },
                                                                    intentContext: ProductIntentContext.SURVEY_LAUNCHED,
                                                                })
                                                            },
                                                            size: 'small',
                                                        },
                                                        secondaryButton: {
                                                            children: 'Cancel',
                                                            type: 'tertiary',
                                                            size: 'small',
                                                        },
                                                    })
                                                }}
                                            >
                                                Launch survey
                                            </Button>
                                        </AccessControlAction>
                                    )}
                                    {isSurveyRunning(survey) && (
                                        <AccessControlAction
                                            resourceType={AccessControlResourceType.Survey}
                                            minAccessLevel={AccessControlLevel.Editor}
                                            userAccessLevel={survey.user_access_level}
                                        >
                                            <Button
                                                fullWidth
                                                onClick={() => {
                                                    Dialog.open({
                                                        title: 'Stop this survey?',
                                                        content: (
                                                            <div className="text-sm text-secondary">
                                                                The survey will no longer be visible to your users.
                                                            </div>
                                                        ),
                                                        primaryButton: {
                                                            children: 'Stop',
                                                            type: 'primary',
                                                            onClick: () => {
                                                                updateSurvey({
                                                                    id: survey.id,
                                                                    updatePayload: {
                                                                        end_date: dayjs().toISOString(),
                                                                    },
                                                                    intentContext:
                                                                        ProductIntentContext.SURVEY_COMPLETED,
                                                                })
                                                            },
                                                            size: 'small',
                                                        },
                                                        secondaryButton: {
                                                            children: 'Cancel',
                                                            type: 'tertiary',
                                                            size: 'small',
                                                        },
                                                    })
                                                }}
                                            >
                                                Stop survey
                                            </Button>
                                        </AccessControlAction>
                                    )}
                                    {survey.end_date && !survey.archived && (
                                        <AccessControlAction
                                            resourceType={AccessControlResourceType.Survey}
                                            minAccessLevel={AccessControlLevel.Editor}
                                            userAccessLevel={survey.user_access_level}
                                        >
                                            <Button
                                                fullWidth
                                                onClick={() =>
                                                    openResumeSurveyDialog(survey, () =>
                                                        updateSurvey({
                                                            id: survey.id,
                                                            updatePayload: { end_date: null },
                                                            intentContext: ProductIntentContext.SURVEY_RESUMED,
                                                        })
                                                    )
                                                }
                                            >
                                                Resume survey
                                            </Button>
                                        </AccessControlAction>
                                    )}
                                    <Divider />
                                    {survey.archived && (
                                        <AccessControlAction
                                            resourceType={AccessControlResourceType.Survey}
                                            minAccessLevel={AccessControlLevel.Editor}
                                            userAccessLevel={survey.user_access_level}
                                        >
                                            <Button
                                                fullWidth
                                                onClick={() => {
                                                    updateSurvey({
                                                        id: survey.id,
                                                        updatePayload: { archived: false },
                                                        intentContext: ProductIntentContext.SURVEY_UNARCHIVED,
                                                    })
                                                }}
                                            >
                                                Unarchive
                                            </Button>
                                        </AccessControlAction>
                                    )}
                                    {!survey.archived && (
                                        <AccessControlAction
                                            resourceType={AccessControlResourceType.Survey}
                                            minAccessLevel={AccessControlLevel.Editor}
                                            userAccessLevel={survey.user_access_level}
                                        >
                                            <Button
                                                fullWidth
                                                onClick={() =>
                                                    openArchiveSurveyDialog(survey, () => {
                                                        const updatePayload: Partial<Survey> = {
                                                            archived: true,
                                                        }
                                                        if (isSurveyRunning(survey)) {
                                                            updatePayload.end_date = dayjs().toISOString()
                                                        }
                                                        updateSurvey({
                                                            id: survey.id,
                                                            updatePayload,
                                                            intentContext: ProductIntentContext.SURVEY_ARCHIVED,
                                                        })
                                                    })
                                                }
                                            >
                                                Archive
                                            </Button>
                                        </AccessControlAction>
                                    )}
                                    {canDeleteSurvey(survey) && (
                                        <AccessControlAction
                                            resourceType={AccessControlResourceType.Survey}
                                            minAccessLevel={AccessControlLevel.Editor}
                                            userAccessLevel={survey.user_access_level}
                                        >
                                            <Button
                                                status="danger"
                                                onClick={() =>
                                                    openDeleteSurveyDialog(survey, () => deleteSurvey(survey.id))
                                                }
                                                fullWidth
                                            >
                                                Delete permanently
                                            </Button>
                                        </AccessControlAction>
                                    )}
                                </>
                            }
                        />
                    )
                },
            },
        ],
        [
            surveysResponsesCount,
            surveysResponsesCountLoading,
            tab,
            teamSdkVersions,
            hasMultipleProjects,
            updateSurvey,
            deleteSurvey,
            duplicateSurvey,
            setSurveyToDuplicate,
        ]
    )

    const isInitialDataLoad = surveys.length === 0 && hasNextPage
    const isTableLoading = dataLoading || isInitialDataLoad
    const shouldShowEmptyState = !isTableLoading && surveys.length === 0

    if (shouldShowEmptyState) {
        return <SurveysEmptyState />
    }

    return (
        <>
            <div>
                <div className={cn('flex flex-wrap gap-2 justify-between mb-0')}>
                    <Shortcut
                        name="SearchSurveys"
                        keybind={[keyBinds.filter]}
                        intent="Search surveys"
                        interaction="click"
                        scope={Scene.Surveys}
                    >
                        <Input
                            type="search"
                            placeholder="Search for surveys"
                            onChange={setSearchTerm}
                            value={searchTerm || ''}
                        />
                    </Shortcut>

                    <div className="flex gap-2 items-center">
                        {tab === SurveysTabs.Active && (
                            <>
                                <span>
                                    <b>Type</b>
                                </span>
                                <Select
                                    dropdownMatchSelectWidth={false}
                                    onChange={(type) => {
                                        setSurveysFilters({ type })
                                    }}
                                    size="small"
                                    options={[
                                        { label: 'Any', value: 'any' },
                                        { label: 'Popover', value: SurveyType.Popover },
                                        { label: 'Widget', value: SurveyType.Widget },
                                        { label: 'Hosted', value: SurveyType.ExternalSurvey },
                                        { label: 'API', value: SurveyType.API },
                                    ]}
                                    value={filters.type}
                                />
                                <span className="ml-1">
                                    <b>Status</b>
                                </span>
                                <Select
                                    dropdownMatchSelectWidth={false}
                                    onChange={(status) => {
                                        setSurveysFilters({ status })
                                    }}
                                    size="small"
                                    options={[
                                        { label: 'Any', value: 'any' },
                                        { label: 'Draft', value: 'draft' },
                                        { label: 'Running', value: 'running' },
                                        { label: 'Complete', value: 'complete' },
                                    ]}
                                    value={filters.status}
                                />
                            </>
                        )}
                        <span className="ml-1">
                            <b>Created by</b>
                        </span>
                        <MemberSelect
                            defaultLabel="Any user"
                            value={filters.created_by ?? null}
                            onChange={(user) => setSurveysFilters({ created_by: user?.id })}
                        />
                    </div>
                </div>
            </div>
            <Table
                dataSource={searchedSurveys}
                defaultSorting={{
                    columnKey: 'created_at',
                    order: -1,
                }}
                rowKey="name"
                nouns={['survey', 'surveys']}
                data-attr="surveys-table"
                emptyState={tab === SurveysTabs.Active ? 'No surveys. Create a new survey?' : 'No surveys found'}
                loading={isTableLoading}
                footer={
                    (searchTerm ? hasNextSearchPage : hasNextPage) && (
                        <div className="flex justify-center p-1">
                            <Button
                                onClick={searchTerm ? loadNextSearchPage : loadNextPage}
                                className="min-w-full text-center"
                                disabledReason={isTableLoading ? 'Loading surveys' : ''}
                            >
                                <span className="flex-1 text-center">
                                    {isTableLoading ? 'Loading...' : 'Load more'}
                                </span>
                            </Button>
                        </div>
                    )
                }
                columns={columns}
            />
        </>
    )
}

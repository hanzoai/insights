import { useActions, useValues } from 'kea'

import { Checkbox, Input, Select } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
import { surveyLogic } from 'scenes/surveys/surveyLogic'

import {
    AvailableFeature,
    SurveyAppearance,
    SurveyPosition,
    SurveySchedule,
    SurveyTabPosition,
    SurveyWidgetType,
} from '~/types'

import { SurveyTabPositionSelector } from './survey-appearance/SurveyTabPositionSelector'
import { surveysLogic } from './surveysLogic'

const tabGridPositions: SurveyTabPosition[] = [
    SurveyTabPosition.Top,
    SurveyTabPosition.Left,
    SurveyTabPosition.Right,
    SurveyTabPosition.Bottom,
]

const tabPositionDisplayNames: Record<SurveyTabPosition, string> = {
    [SurveyTabPosition.Top]: 'Top',
    [SurveyTabPosition.Left]: 'Left',
    [SurveyTabPosition.Right]: 'Right',
    [SurveyTabPosition.Bottom]: 'Bottom',
}

export function SurveyWidgetCustomization(): JSX.Element {
    const { survey, surveyErrors } = useValues(surveyLogic)
    const { setSurveyValue } = useActions(surveyLogic)
    const { surveysStylingAvailable } = useValues(surveysLogic)

    const validationErrors = surveyErrors?.appearance

    return (
        <div className="flex flex-col gap-2">
            <Field name="appearance" label="">
                {({
                    value: appearance,
                    onChange: onAppearanceChange,
                }: {
                    value: SurveyAppearance
                    onChange: (appearance: SurveyAppearance) => void
                }) => (
                    <>
                        <Field.Pure label="Feedback button type">
                            <Select
                                value={appearance.widgetType}
                                onChange={(widgetType) => {
                                    // NextToTrigger is only available for Selector widget type
                                    const newPosition =
                                        widgetType !== SurveyWidgetType.Selector &&
                                        appearance?.position === SurveyPosition.NextToTrigger
                                            ? SurveyPosition.Right
                                            : appearance?.position

                                    onAppearanceChange({ ...appearance, widgetType, position: newPosition })
                                }}
                                options={[
                                    { label: 'Embedded tab', value: SurveyWidgetType.Tab },
                                    { label: 'Custom', value: SurveyWidgetType.Selector },
                                ]}
                            />
                        </Field.Pure>
                        {survey.appearance?.widgetType === 'selector' ? (
                            <Field.Pure
                                label="CSS selector"
                                info="Enter a class or ID selector for the feedback button, like .feedback-button or #feedback-button. If you're using a custom theme, you can use the theme's class name."
                            >
                                <Input
                                    value={appearance.widgetSelector}
                                    onChange={(widgetSelector) => onAppearanceChange({ ...appearance, widgetSelector })}
                                    placeholder="ex: .feedback-button, #feedback-button"
                                />
                                {validationErrors?.widgetSelector && (
                                    <Field.Error error={validationErrors?.widgetSelector} />
                                )}
                            </Field.Pure>
                        ) : (
                            <>
                                <Field.Pure label="Button label">
                                    <Input
                                        value={appearance.widgetLabel}
                                        onChange={(widgetLabel) => onAppearanceChange({ ...appearance, widgetLabel })}
                                    />
                                </Field.Pure>
                                <Field.Pure label="Background color">
                                    <Input
                                        value={appearance.widgetColor}
                                        onChange={(widgetColor) => onAppearanceChange({ ...appearance, widgetColor })}
                                        placeholder="#e0a045"
                                    />
                                </Field.Pure>
                                <Field.Pure
                                    label="Button position"
                                    className="gap-1 col-span-2"
                                    premiumFeature={AvailableFeature.SURVEYS_STYLING}
                                    info="Requires at least version 1.294.0 of insights-js"
                                >
                                    <div className="flex items-center gap-2">
                                        <SurveyTabPositionSelector
                                            currentPosition={appearance.tabPosition ?? SurveyTabPosition.Right}
                                            onAppearanceChange={(update) =>
                                                onAppearanceChange({ ...appearance, ...update })
                                            }
                                            disabled={!surveysStylingAvailable}
                                        />
                                        <Select
                                            value={appearance.tabPosition ?? SurveyTabPosition.Right}
                                            onChange={(tabPosition) =>
                                                onAppearanceChange({ ...appearance, tabPosition })
                                            }
                                            options={tabGridPositions.map((position) => ({
                                                label: tabPositionDisplayNames[position],
                                                value: position,
                                            }))}
                                            disabled={!surveysStylingAvailable}
                                        />
                                    </div>
                                </Field.Pure>
                            </>
                        )}
                    </>
                )}
            </Field>
            <Checkbox
                label="Allow survey to be displayed every time the button is clicked"
                className="mt-2"
                checked={survey.schedule === SurveySchedule.Always}
                onChange={(checked) => {
                    setSurveyValue('schedule', checked ? SurveySchedule.Always : SurveySchedule.Once)
                    setSurveyValue('iteration_count', 0)
                    setSurveyValue('iteration_frequency_days', 0)
                }}
            />
        </div>
    )
}

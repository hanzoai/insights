import { useActions, useValues } from 'kea'

import {
    Banner,
    Button,
    Card,
    ColorPicker,
    Divider,
    Input,
    Select,
    Switch,
    Link,
} from '@hanzo/elements'

import { teamLogic } from 'scenes/teamLogic'

import { SceneSection } from '~/layout/scenes/components/SceneSection'

import { supportSettingsLogic } from './supportSettingsLogic'

export function WidgetSection(): JSX.Element {
    const { currentTeam } = useValues(teamLogic)
    const { updateCurrentTeam } = useActions(teamLogic)
    const {
        generateNewToken,
        setWidgetEnabledLoading,
        setGreetingInputValue,
        saveGreetingText,
        setIdentificationFormTitleValue,
        saveIdentificationFormTitle,
        setIdentificationFormDescriptionValue,
        saveIdentificationFormDescription,
        setPlaceholderTextValue,
        savePlaceholderText,
    } = useActions(supportSettingsLogic)
    const {
        widgetEnabledLoading,
        greetingInputValue,
        identificationFormTitleValue,
        identificationFormDescriptionValue,
        placeholderTextValue,
    } = useValues(supportSettingsLogic)

    return (
        <SceneSection
            title="In-app widget"
            description={
                <>
                    Add a chat widget to your website for customers to reach you.{' '}
                    <Link to="https://hanzo.ai/docs/support/widget" target="_blank">
                        Docs
                    </Link>
                    . For logged-in users, use{' '}
                    <Link
                        to="https://hanzo.ai/docs/support/javascript-api#user-identification"
                        target="_blank"
                        targetBlankIcon
                    >
                        identity verification
                    </Link>{' '}
                    so tickets persist across browsers and devices.
                </>
            }
        >
            <Card hoverEffect={false} className="flex flex-col gap-y-2 max-w-[800px] px-4 py-3">
                <div className="flex items-center gap-4 justify-between">
                    <div>
                        <label className="w-40 shrink-0 font-medium">Enable in-app widget</label>
                        <p className="text-xs text-muted-alt">
                            Turn on the in-app support widget to start receiving messages from your users
                        </p>
                    </div>
                    <Switch
                        checked={!!currentTeam?.conversations_settings?.widget_enabled}
                        onChange={(checked) => {
                            setWidgetEnabledLoading(true)
                            updateCurrentTeam({
                                conversations_settings: {
                                    ...currentTeam?.conversations_settings,
                                    widget_enabled: checked,
                                },
                            })
                        }}
                        loading={widgetEnabledLoading}
                    />
                </div>

                {currentTeam?.conversations_settings?.widget_enabled && (
                    <>
                        <Divider />
                        <Banner type="info" className="my-2">
                            Allowed domains for the widget are managed under the <strong>Direct API</strong> section —
                            they apply to both the widget and direct API calls.
                        </Banner>
                        <SceneSection title="Visual settings" className="mt-8" titleSize="sm">
                            <Card hoverEffect={false} className="px-4 py-3">
                                <div className="flex items-center gap-4 py-2 justify-between">
                                    <label className="w-40 shrink-0 font-medium">Button color</label>
                                    <ColorPicker
                                        colors={[
                                            '#1d4aff',
                                            '#00aaff',
                                            '#00cc44',
                                            '#ffaa00',
                                            '#ff4444',
                                            '#9b59b6',
                                            '#1abc9c',
                                            '#000000',
                                        ]}
                                        selectedColor={currentTeam?.conversations_settings?.widget_color || '#1d4aff'}
                                        onSelectColor={(color) => {
                                            updateCurrentTeam({
                                                conversations_settings: {
                                                    ...currentTeam?.conversations_settings,
                                                    widget_color: color,
                                                },
                                            })
                                        }}
                                        showCustomColor
                                    />
                                </div>
                                <Divider />
                                <div className="flex items-center gap-4 py-2 justify-between">
                                    <label className="w-40 shrink-0 font-medium">Widget position</label>
                                    <Select
                                        value={currentTeam?.conversations_settings?.widget_position || 'bottom_right'}
                                        onChange={(value) => {
                                            updateCurrentTeam({
                                                conversations_settings: {
                                                    ...currentTeam?.conversations_settings,
                                                    widget_position: value,
                                                },
                                            })
                                        }}
                                        options={[
                                            { value: 'bottom_right', label: 'Bottom right' },
                                            { value: 'bottom_left', label: 'Bottom left' },
                                            { value: 'top_right', label: 'Top right' },
                                            { value: 'top_left', label: 'Top left' },
                                        ]}
                                    />
                                </div>
                                <Divider />
                                <div className="flex items-center gap-4 py-2 justify-between">
                                    <label className="w-40 shrink-0 font-medium">Greeting message</label>
                                    <div className="flex gap-2 flex-1">
                                        <Input
                                            value={
                                                greetingInputValue ??
                                                currentTeam?.conversations_settings?.widget_greeting_text ??
                                                'Hey, how can I help you today?'
                                            }
                                            placeholder="Enter greeting message"
                                            onChange={setGreetingInputValue}
                                            fullWidth
                                        />
                                        <Button
                                            type="primary"
                                            onClick={saveGreetingText}
                                            disabledReason={
                                                !greetingInputValue ? 'Enter a greeting message' : undefined
                                            }
                                        >
                                            Save
                                        </Button>
                                    </div>
                                </div>
                                <Divider />
                                <div className="flex items-center gap-4 py-2 justify-between">
                                    <label className="w-40 shrink-0 font-medium">Placeholder text</label>
                                    <div className="flex gap-2 flex-1">
                                        <Input
                                            value={
                                                placeholderTextValue ??
                                                currentTeam?.conversations_settings?.widget_placeholder_text ??
                                                'Type your message...'
                                            }
                                            placeholder="Enter placeholder text"
                                            onChange={setPlaceholderTextValue}
                                            fullWidth
                                        />
                                        <Button
                                            type="primary"
                                            onClick={savePlaceholderText}
                                            disabledReason={
                                                !placeholderTextValue ? 'Enter placeholder text' : undefined
                                            }
                                        >
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </SceneSection>
                        <SceneSection title="Identification form" className="mt-8" titleSize="sm">
                            <Card hoverEffect={false} className="px-4 py-3">
                                <div className="flex items-center gap-4 py-2 justify-between">
                                    <div>
                                        <label className="w-40 shrink-0 font-medium">Require email</label>
                                        <p className="text-xs text-muted-alt mb-2">
                                            Require user to enter their email address to start the chat.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={!!currentTeam?.conversations_settings?.widget_require_email}
                                        onChange={(checked) => {
                                            updateCurrentTeam({
                                                conversations_settings: {
                                                    ...currentTeam?.conversations_settings,
                                                    widget_require_email: checked,
                                                },
                                            })
                                        }}
                                    />
                                </div>

                                {currentTeam?.conversations_settings?.widget_require_email && (
                                    <>
                                        <Divider />
                                        <div className="flex items-center gap-4 py-2 justify-between">
                                            <div>
                                                <label className="w-40 shrink-0 font-medium">Collect name</label>
                                                <p className="text-xs text-muted-alt mb-2">
                                                    Collect user's name to personalize the chat.
                                                </p>
                                            </div>
                                            <Switch
                                                checked={!!currentTeam?.conversations_settings?.widget_collect_name}
                                                onChange={(checked) => {
                                                    updateCurrentTeam({
                                                        conversations_settings: {
                                                            ...currentTeam?.conversations_settings,
                                                            widget_collect_name: checked,
                                                        },
                                                    })
                                                }}
                                            />
                                        </div>
                                        <Divider />
                                        <div className="flex items-center gap-4 py-2 justify-between">
                                            <label className="w-40 shrink-0 font-medium">Form title</label>
                                            <div className="flex gap-2 flex-1">
                                                <Input
                                                    value={
                                                        identificationFormTitleValue ??
                                                        currentTeam?.conversations_settings
                                                            ?.widget_identification_form_title ??
                                                        'Before we start...'
                                                    }
                                                    placeholder="Enter form title"
                                                    onChange={setIdentificationFormTitleValue}
                                                    fullWidth
                                                />
                                                <Button
                                                    type="primary"
                                                    onClick={saveIdentificationFormTitle}
                                                    disabledReason={
                                                        !identificationFormTitleValue ? 'Enter form title' : undefined
                                                    }
                                                >
                                                    Save
                                                </Button>
                                            </div>
                                        </div>
                                        <Divider />
                                        <div className="flex items-center gap-4 py-2 justify-between">
                                            <label className="w-40 shrink-0 font-medium">Form description</label>
                                            <div className="flex gap-2 flex-1">
                                                <Input
                                                    value={
                                                        identificationFormDescriptionValue ??
                                                        currentTeam?.conversations_settings
                                                            ?.widget_identification_form_description ??
                                                        'Please provide your details so we can help you better.'
                                                    }
                                                    placeholder="Enter form description"
                                                    onChange={setIdentificationFormDescriptionValue}
                                                    fullWidth
                                                />
                                                <Button
                                                    type="primary"
                                                    onClick={saveIdentificationFormDescription}
                                                    disabledReason={
                                                        !identificationFormDescriptionValue
                                                            ? 'Enter form description'
                                                            : undefined
                                                    }
                                                >
                                                    Save
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </Card>
                        </SceneSection>
                        <div className="pt-8">
                            <div className="flex items-center gap-4 py-2 justify-between">
                                <div>
                                    <label className="w-40 shrink-0 font-medium">Public token</label>
                                    <p className="text-xs text-muted-alt mb-2">
                                        Automatically generated token used to authenticate widget requests.
                                    </p>
                                </div>
                                <div className="flex gap-2 flex-1">
                                    <Input
                                        value={
                                            currentTeam?.conversations_settings?.widget_public_token ||
                                            'Token will be auto-generated on save'
                                        }
                                        disabledReason="Read-only after generation"
                                        fullWidth
                                    />
                                    {currentTeam?.conversations_settings?.widget_public_token && (
                                        <Button type="secondary" status="danger" onClick={generateNewToken}>
                                            Regenerate
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <Banner type="warning" className="my-2">
                                Only regenerate if you suspect it has been exposed or compromised.
                            </Banner>
                        </div>
                    </>
                )}
            </Card>
        </SceneSection>
    )
}

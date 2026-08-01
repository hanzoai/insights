import { Meta } from '@storybook/react'
import { useActions, useValues } from 'kea'

import { Card } from '@hanzo/elements'

import { CollapsibleExceptionList } from 'lib/components/Errors/ExceptionList/CollapsibleExceptionList'
import { sceneLogic } from 'scenes/sceneLogic'

import { mswDecorator } from '~/mocks/browser'

import { ExceptionLogicWrapper, TEST_EVENTS, TestEventName } from '../../../../__mocks__/events'
import { results as batchGetResults } from '../../../../__mocks__/stack_frames/batch_get'
import { StyleVariables } from '../../../StyleVariables'
import { exceptionCardLogic } from '../../exceptionCardLogic'

const meta: Meta = {
    title: 'ErrorTracking/StacktraceDisplay',
    parameters: {
        layout: 'centered',
        viewMode: 'story',
    },
    decorators: [
        (Story: React.FC): JSX.Element => {
            sceneLogic.mount()
            return (
                <StyleVariables>
                    <Card hoverEffect={false} className="p-2 w-[900px]">
                        <Story />
                    </Card>
                </StyleVariables>
            )
        },
        mswDecorator({
            post: {
                'api/environments/:team_id/error_tracking/stack_frames/batch_get/': { results: batchGetResults },
            },
        }),
    ],
}

export default meta

////////////////////// Generic stacktraces

export function GenericDisplayPropertiesLoading(): JSX.Element {
    return (
        <ExceptionLogicWrapper eventName="python_resolved" loading={true}>
            <StackTraceGenericDisplay />
        </ExceptionLogicWrapper>
    )
}
GenericDisplayPropertiesLoading.parameters = { testOptions: { waitForLoadersToDisappear: false } }

export function GenericDisplayEmpty(): JSX.Element {
    return (
        <ExceptionLogicWrapper eventName="javascript_empty">
            <StackTraceGenericDisplay />
        </ExceptionLogicWrapper>
    )
}

export function GenericDisplayWithStacktrace(): JSX.Element {
    return (
        <StacktraceWrapperAllEvents>
            <StackTraceGenericDisplay />
        </StacktraceWrapperAllEvents>
    )
}

export function GenericDisplayWithJavascriptScriptError(): JSX.Element {
    return (
        <ExceptionLogicWrapper eventName="javascript_script_error">
            <StackTraceGenericDisplay />
        </ExceptionLogicWrapper>
    )
}

export function GenericDisplayWithMinifiedReactError(): JSX.Element {
    return (
        <ExceptionLogicWrapper eventName="javascript_minified_react_error">
            <StackTraceGenericDisplay />
        </ExceptionLogicWrapper>
    )
}

export function GenericDisplayWithNonErrorPromiseRejection(): JSX.Element {
    return (
        <ExceptionLogicWrapper eventName="javascript_non_error_promise_rejection">
            <StackTraceGenericDisplay />
        </ExceptionLogicWrapper>
    )
}

export function GenericDisplayWithLongFrames(): JSX.Element {
    return (
        <ExceptionLogicWrapper eventName="node_long_frame">
            <StackTraceGenericDisplay />
        </ExceptionLogicWrapper>
    )
}

export function GenericDisplayWithNestedExceptions(): JSX.Element {
    return (
        <ExceptionLogicWrapper eventName="python_multierror">
            <StackTraceGenericDisplay />
        </ExceptionLogicWrapper>
    )
}

//////////////////// Utils

function StacktraceWrapperAllEvents({ children }: { children: JSX.Element }): JSX.Element {
    const eventNames = Object.keys(TEST_EVENTS) as TestEventName[]
    return (
        <div className="space-y-4">
            {eventNames.map((name: TestEventName) => {
                return (
                    <ExceptionLogicWrapper key={name} eventName={name}>
                        <Card hoverEffect={false} className="p-2">
                            {children}
                        </Card>
                    </ExceptionLogicWrapper>
                )
            })}
        </div>
    )
}

function StackTraceGenericDisplay({ className }: { className?: string }): JSX.Element {
    const { expandedFrameRawIds } = useValues(exceptionCardLogic)
    const { setFrameExpanded } = useActions(exceptionCardLogic)
    return (
        <CollapsibleExceptionList
            expandedFrameRawIds={expandedFrameRawIds}
            onFrameExpandedChange={setFrameExpanded}
            className={className}
        />
    )
}

import { Link } from '@hanzo/elements'

import { defineKnownException } from '../registry'
import { KnownExceptionBanner } from './base'

defineKnownException({
    match(exception) {
        return exception.value?.startsWith('Non-Error promise rejection') ?? false
    },
    render() {
        return (
            <KnownExceptionBanner>
                This issue occurs when non Error objects are provided to Promise rejections. When you do this a stack
                trace is not captured as part of the caught exception.{' '}
                <Link
                    to="https://hanzo.ai/docs/error-tracking/common-questions#what-is-a-non-error-promise-rejection-error-with-no-stack-traces"
                    target="_blank"
                >
                    Read our docs
                </Link>{' '}
                to learn how to get the full exception context.
            </KnownExceptionBanner>
        )
    },
})

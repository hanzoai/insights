import { useValues } from 'kea'

import { Skeleton } from '@hanzo/elements'

import { integrationsLogic } from 'lib/integrations/integrationsLogic'

import { IntegrationEmailDomainView } from './IntegrationEmailDomainView'

export function EmailIntegrationsList(): JSX.Element {
    const { integrationsLoading, domainGroupedEmailIntegrations } = useValues(integrationsLogic)

    return (
        <div className="deprecated-space-y-2">
            {integrationsLoading ? (
                <Skeleton className="h-10" />
            ) : (
                domainGroupedEmailIntegrations.map((integration) => (
                    <IntegrationEmailDomainView key={integration.domain} integration={integration} />
                ))
            )}
        </div>
    )
}

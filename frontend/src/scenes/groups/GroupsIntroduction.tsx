import { CAPABILITIES } from 'lib/capabilities'
import { Unavailable } from 'lib/components/Unavailable/Unavailable'

/**
 * Where someone lands on a groups surface: the Groups scene, the group-analytics settings pane, the
 * B2B customer-analytics view.
 */
export function GroupsIntroduction(): JSX.Element {
    return <Unavailable capability="groups" />
}

/**
 * The footer under an aggregation picker, saying why there is nothing to group by. Short, because
 * it sits inside a dropdown, and it links nowhere: the two links it used to offer were an upgrade
 * to a plan that is not sold, and docs for a product this build does not serve.
 */
export function GroupIntroductionFooter(): JSX.Element {
    return <div className="text-sm bg-primary rounded p-2 max-w-60">{CAPABILITIES.groups.body}</div>
}

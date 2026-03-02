import { customerioPlugin } from './_destinations/customerio/template'
import { hubspotPlugin } from './_destinations/hubspot/template'
import { intercomPlugin } from './_destinations/intercom/template'
import { pacePlugin } from './_destinations/pace-insights-integration/template'
import { avoPlugin } from './_destinations/insights-avo/template'
import { brazePlugin } from './_destinations/insights-braze-app/template'
import { engagePlugin } from './_destinations/insights-engage-so/template'
import { gcsPlugin } from './_destinations/insights-gcs/template'
import { laudspeakerPlugin } from './_destinations/insights-laudspeaker-app/template'
import { patternsPlugin } from './_destinations/insights-patterns-app/template'
import { replicatorPlugin } from './_destinations/insights-plugin-replicator/template'
import { pubsubPlugin } from './_destinations/pubsub/template'
import { rudderstackPlugin } from './_destinations/rudderstack-insights/template'
import { salesforcePlugin } from './_destinations/salesforce/template'
import { sendgridPlugin } from './_destinations/sendgrid/template'
import { pluginStonlyCleanCampaignName } from './_transformations/Plugin-Stonly-Clean-Campaign-Name/template'
import { currencyNormalizationPlugin } from './_transformations/currency-normalization-plugin/template'
import { downsamplingPlugin } from './_transformations/downsampling-plugin/template'
import { dropEventsOnPropertyPlugin } from './_transformations/drop-events-on-property-plugin/template'
import { firstTimeEventTrackerPlugin } from './_transformations/first-time-event-tracker/template'
import { flattenPropertiesPlugin } from './_transformations/flatten-properties-plugin/template'
import { languageUrlSplitterApp } from './_transformations/language-url-splitter-app/template'
import { phShotgunProcessEventApp } from './_transformations/ph-shotgun-processevent-app/template'
import { pluginAdvancedGeoip } from './_transformations/plugin-advanced-geoip/template'
import { pluginNetdataEventProcessing } from './_transformations/plugin-netdata-event-processing/template'
import { pluginStonlyUtmExtractor } from './_transformations/plugin-stonly-UTM-Extractor/template'
import { insightsAnonymization } from './_transformations/insights-anonymization/template'
import { insightsAppUnduplicator } from './_transformations/insights-app-unduplicator/template'
import { insightsAppUrlParametersToEventProperties } from './_transformations/insights-app-url-parameters-to-event-properties/template'
import { insightsFilterOutPlugin } from './_transformations/insights-filter-out-plugin/template'
import { insightsPluginGeoip } from './_transformations/insights-plugin-geoip/template'
import { insightsPluginSnowplowRefererParser } from './_transformations/insights-plugin-snowplow-referer-parser/template'
import { insightsRouteCensorPlugin } from './_transformations/insights-route-censor-plugin/template'
import { insightsUrlNormalizerPlugin } from './_transformations/insights-url-normalizer-plugin/template'
import { propertyFilterPlugin } from './_transformations/property-filter-plugin/template'
import { semverFlattenerPlugin } from './_transformations/semver-flattener-plugin/template'
import { taxonomyPlugin } from './_transformations/taxonomy-plugin/template'
import { timestampParserPlugin } from './_transformations/timestamp-parser-plugin/template'
import { urlParserPlugin } from './_transformations/url-parser/template'
import { userAgentPlugin } from './_transformations/user-agent-plugin/template'
import { LegacyDestinationPlugin, LegacyTransformationPlugin } from './types'

export const DESTINATION_PLUGINS: LegacyDestinationPlugin[] = [
    customerioPlugin,
    hubspotPlugin,
    intercomPlugin,
    pacePlugin,
    avoPlugin,
    brazePlugin,
    engagePlugin,
    gcsPlugin,
    laudspeakerPlugin,
    patternsPlugin,
    replicatorPlugin,
    pubsubPlugin,
    rudderstackPlugin,
    salesforcePlugin,
    sendgridPlugin,
]

export const TRANSFORMATION_PLUGINS: LegacyTransformationPlugin[] = [
    currencyNormalizationPlugin,
    downsamplingPlugin,
    dropEventsOnPropertyPlugin,
    firstTimeEventTrackerPlugin,
    flattenPropertiesPlugin,
    languageUrlSplitterApp,
    phShotgunProcessEventApp,
    pluginAdvancedGeoip,
    pluginNetdataEventProcessing,
    pluginStonlyCleanCampaignName,
    pluginStonlyUtmExtractor,
    insightsAnonymization,
    insightsAppUnduplicator,
    insightsAppUrlParametersToEventProperties,
    insightsFilterOutPlugin,
    insightsPluginGeoip,
    insightsPluginSnowplowRefererParser,
    insightsRouteCensorPlugin,
    insightsUrlNormalizerPlugin,
    propertyFilterPlugin,
    semverFlattenerPlugin,
    taxonomyPlugin,
    timestampParserPlugin,
    urlParserPlugin,
    userAgentPlugin,
]

export const DESTINATION_PLUGINS_BY_ID = DESTINATION_PLUGINS.reduce(
    (acc, plugin) => {
        acc[plugin.template.id] = plugin
        return acc
    },
    {} as Record<string, LegacyDestinationPlugin>
)

export const TRANSFORMATION_PLUGINS_BY_ID = TRANSFORMATION_PLUGINS.reduce(
    (acc, plugin) => {
        acc[plugin.template.id] = plugin
        return acc
    },
    {} as Record<string, LegacyTransformationPlugin>
)

import { SURVEY_SDK_REQUIREMENTS, SurveySdkType } from './surveyVersionRequirements'

const ALL_SDK_TYPES: SurveySdkType[] = [
    'insights-js',
    'insights-react-native',
    'insights-ios',
    'insights-android',
    'insights_flutter',
]

describe('SURVEY_SDK_REQUIREMENTS', () => {
    it.each(SURVEY_SDK_REQUIREMENTS.map((req) => [req.feature, req]))(
        '"%s" must cover all SDK types in sdkVersions + unsupportedSdks',
        (_, requirement) => {
            const coveredByVersions = Object.keys(requirement.sdkVersions) as SurveySdkType[]
            const coveredByUnsupported = (requirement.unsupportedSdks ?? []).map((u) => u.sdk)
            const allCovered = new Set([...coveredByVersions, ...coveredByUnsupported])

            const missing = ALL_SDK_TYPES.filter((sdk) => !allCovered.has(sdk))

            expect(missing).toEqual([])
        }
    )
})

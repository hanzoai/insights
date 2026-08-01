import type { SdkType } from './sdkHealthLogic'

export const SDK_TYPE_READABLE_NAME: Record<SdkType, string> = {
    web: 'Web',
    'insights-ios': 'iOS',
    'insights-android': 'Android',
    'insights-java': 'Java (legacy)',
    'insights-server': 'Java',
    'insights-node': 'Node.js',
    'insights-python': 'Python',
    'insights-php': 'PHP',
    'insights-ruby': 'Ruby',
    'insights-go': 'Go',
    'insights-flutter': 'Flutter',
    'insights-react-native': 'React Native',
    'insights-kmp': 'Kotlin Multiplatform',
    'insights-dotnet': '.NET',
    'insights-elixir': 'Elixir',
}

export const SDK_DOCS_LINKS: Record<SdkType, { releases: string; docs: string }> = {
    web: {
        releases: 'https://github.com/Insights/insights-js/blob/main/packages/browser/CHANGELOG.md',
        docs: 'https://hanzo.ai/docs/libraries/js',
    },
    'insights-ios': {
        releases: 'https://github.com/Insights/insights-ios/releases',
        docs: 'https://hanzo.ai/docs/libraries/ios',
    },
    'insights-android': {
        releases: 'https://github.com/Insights/insights-android/releases',
        docs: 'https://hanzo.ai/docs/libraries/android',
    },
    'insights-java': {
        releases: 'https://github.com/Insights/insights-java/releases',
        docs: 'https://hanzo.ai/docs/libraries/java',
    },
    'insights-server': {
        releases: 'https://github.com/Insights/insights-android/releases?q=server-v',
        docs: 'https://hanzo.ai/docs/libraries/java',
    },
    'insights-node': {
        releases: 'https://github.com/Insights/insights-js/blob/main/packages/node/CHANGELOG.md',
        docs: 'https://hanzo.ai/docs/libraries/node',
    },
    'insights-python': {
        releases: 'https://github.com/Insights/insights-python/releases',
        docs: 'https://hanzo.ai/docs/libraries/python',
    },
    'insights-php': {
        releases: 'https://github.com/Insights/insights-php/releases',
        docs: 'https://hanzo.ai/docs/libraries/php',
    },
    'insights-ruby': {
        releases: 'https://github.com/Insights/insights-ruby/releases',
        docs: 'https://hanzo.ai/docs/libraries/ruby',
    },
    'insights-go': {
        releases: 'https://github.com/Insights/insights-go/releases',
        docs: 'https://hanzo.ai/docs/libraries/go',
    },
    'insights-flutter': {
        releases: 'https://github.com/Insights/insights-flutter/releases',
        docs: 'https://hanzo.ai/docs/libraries/flutter',
    },
    'insights-react-native': {
        releases: 'https://github.com/Insights/insights-js/blob/main/packages/react-native/CHANGELOG.md',
        docs: 'https://hanzo.ai/docs/libraries/react-native',
    },
    'insights-kmp': {
        releases: 'https://github.com/Insights/insights-kmp/releases',
        docs: 'https://github.com/Insights/insights-kmp',
    },
    'insights-dotnet': {
        releases: 'https://github.com/Insights/insights-dotnet/releases',
        docs: 'https://hanzo.ai/docs/libraries/dotnet',
    },
    'insights-elixir': {
        releases: 'https://github.com/Insights/insights-elixir/releases',
        docs: 'https://hanzo.ai/docs/libraries/elixir',
    },
}

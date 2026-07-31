import { IconCode } from '@hanzo/icons'
import { Button } from '@hanzo/elements'

import { IconLink } from 'lib/elements/icons'
import { copyToClipboard } from 'lib/utils/copyToClipboard'

function getSurveyUrl(surveyId: string): string {
    const url = new URL(window.location.origin)
    url.pathname = `/external_surveys/${surveyId}`
    return url.toString()
}

function getEmbedSnippet(surveyId: string): string {
    const surveyUrl = getSurveyUrl(surveyId)
    return `<div id="insights-survey-container-${surveyId}"></div>
<script>
  (function() {
    var container = document.getElementById('insights-survey-container-${surveyId}');
    var iframe = document.createElement('iframe');
    iframe.id = 'insights-survey-${surveyId}';
    iframe.width = '100%';
    iframe.frameBorder = '0';
    iframe.style.cssText = 'border: none; border-radius: 12px; max-width: 720px;';

    var baseUrl = '${surveyUrl}?embed=true';

    function loadSurvey() {
      var url = baseUrl;
      var distinctId = window.insights?.get_distinct_id?.();
      if (distinctId) {
        url += '&distinct_id=' + encodeURIComponent(distinctId);
      }
      iframe.src = url;
      container.appendChild(iframe);
    }

    if (window.insights?.onFeatureFlags) {
      window.insights.onFeatureFlags(loadSurvey);
    } else {
      loadSurvey();
    }

    window.addEventListener('message', function(e) {
      if (e.origin !== '${new URL(surveyUrl).origin}') return;
      if (e.data.type === 'insights:survey:height' && e.data.surveyId === '${surveyId}') {
        var height = parseInt(e.data.height, 10);
        if (height > 0 && height < 10000) {
          iframe.style.height = height + 'px';
        }
      }
    });
  })();
</script>`
}

export function CopySurveyLink({
    surveyId,
    enableIframeEmbedding,
    className,
}: {
    surveyId: string
    enableIframeEmbedding?: boolean
    className?: string
}): JSX.Element {
    return (
        <div className={`flex flex-row gap-2 ${className ?? ''}`}>
            <Button
                icon={<IconLink />}
                onClick={() => {
                    copyToClipboard(getSurveyUrl(surveyId), 'survey link')
                }}
                size="small"
                tooltip="Responses are anonymous. Add the distinct_id query parameter to identify respondents."
            >
                Copy URL
            </Button>
            {enableIframeEmbedding && (
                <Button
                    icon={<IconCode />}
                    onClick={() => {
                        copyToClipboard(getEmbedSnippet(surveyId), 'embed code')
                    }}
                    size="small"
                    tooltip="Copy HTML snippet to embed this survey in an iframe"
                >
                    Copy embed code
                </Button>
            )}
        </div>
    )
}

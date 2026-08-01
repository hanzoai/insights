package auth

import "strings"

func DeriveStreamHost(appHost string) string {
	appHost = strings.TrimRight(appHost, "/")

	switch appHost {
	case "https://us.hanzo.ai", "https://app.hanzo.ai":
		return "https://live.us.hanzo.ai"
	case "https://eu.hanzo.ai":
		return "https://live.eu.hanzo.ai"
	case "https://app.dev.insights.dev":
		return "https://live.dev.insights.dev"
	default:
		return "http://localhost:8010" // Local development stream host
	}
}

package auth

import "strings"

func DeriveStreamHost(appHost string) string {
	appHost = strings.TrimRight(appHost, "/")

	switch appHost {
	case "https://us.insights.hanzo.ai", "https://insights.hanzo.ai":
		return "https://live.us.insights.hanzo.ai"
	case "https://eu.insights.hanzo.ai":
		return "https://live.eu.insights.hanzo.ai"
	case "https://dev.insights.hanzo.ai":
		return "https://live.dev.insights.hanzo.ai"
	default:
		return "http://localhost:8010" // Local development stream host
	}
}

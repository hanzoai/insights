package core

import (
	insights "github.com/hanzoai/insights-go"
)

const insightsAPIKey = "sTMFPsFhdP1Ssg"
const endpoint = "https://us.i.insights.hanzo.ai"

var client insights.Client

func init() {
	var err error
	client, err = insights.NewWithConfig(insightsAPIKey, insights.Config{
		Endpoint: endpoint,
	})
	if err != nil {
		client = nil
	}
}

func SendInstallStartEvent(domain string) {
	sendEvent(domain, "magic_curl_install_start")
}

func SendInstallCompleteEvent(domain string) {
	sendEvent(domain, "magic_curl_install_complete")
}

func sendEvent(domain, eventName string) {
	if client == nil {
		return
	}

	_ = client.Enqueue(insights.Capture{
		DistinctId: domain,
		Event:      eventName,
		Properties: insights.NewProperties().Set("domain", domain),
	})
}

func CloseTelemetry() {
	if client != nil {
		_ = client.Close()
	}
}

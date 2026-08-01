package auth

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestDeriveStreamHost(t *testing.T) {
	tests := []struct {
		name     string
		appHost  string
		expected string
	}{
		{"US cloud", "https://us.hanzo.ai", "https://live.us.hanzo.ai"},
		{"US cloud trailing slash", "https://us.hanzo.ai/", "https://live.us.hanzo.ai"},
		{"app.hanzo.ai defaults to US", "https://app.hanzo.ai", "https://live.us.hanzo.ai"},
		{"EU cloud", "https://eu.hanzo.ai", "https://live.eu.hanzo.ai"},
		{"dev environment", "https://app.dev.insights.dev", "https://live.dev.insights.dev"},
		{"local dev", "http://localhost:8000", "http://localhost:8010"},
		{"unknown host", "https://custom.example.com", "http://localhost:8010"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := DeriveStreamHost(tt.appHost)
			assert.Equal(t, tt.expected, result)
		})
	}
}

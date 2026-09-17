package sse

import "time"

type EventMsg struct {
	UUID       string         `json:"uuid"`
	Timestamp  any            `json:"timestamp"`
	DistinctID string         `json:"distinct_id"`
	PersonID   string         `json:"person_id"`
	Event      string         `json:"event"`
	Properties map[string]any `json:"properties"`
	ReceivedAt time.Time
}

type GeoEventMsg struct {
	Lat         float64 `json:"lat"`
	Lng         float64 `json:"lng"`
	CountryCode string  `json:"country_code"`
	DistinctID  string  `json:"distinct_id"`
	Count       uint    `json:"count"`
	ReceivedAt  time.Time
}

type StatsMsg struct {
	UsersOnProduct   int `json:"users_on_product"`
	ActiveRecordings int `json:"active_recordings"`
}

type StatsErrorMsg struct {
	Err error
}

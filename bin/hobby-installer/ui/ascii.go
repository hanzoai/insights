package ui

import "github.com/charmbracelet/lipgloss"

const insightsBanner = `
 ____           _   _   _             
|  _ \ ___  ___| |_| | | | ___   __ _ 
| |_) / _ \/ __| __| |_| |/ _ \ / _` + "`" + ` |
|  __/ (_) \__ \ |_|  _  | (_) | (_| |
|_|   \___/|___/\__|_| |_|\___/ \__, |
                                |___/ 
`

var bannerStyle = lipgloss.NewStyle().
	Foreground(ColorPrimary).
	Bold(true)

func GetBanner() string {
	return bannerStyle.Render(insightsBanner)
}

func GetWelcomeArt() string {
	return lipgloss.JoinVertical(
		lipgloss.Center,
		GetBanner(),
		"",
		bannerStyle.Render("🦔 Self-Hosted Hobby Installer"),
	)
}

func GoodbyeView() string {
	return lipgloss.JoinVertical(
		lipgloss.Center,
		"",
		MutedStyle.Render("Goodbye! 🦔"),
		"",
	)
}

package steps

import (
	"crypto/rand"
	"fmt"
	"math/big"

	"github.com/charmbracelet/bubbles/key"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/hanzoai/insights/bin/hobby-installer/core"
	"github.com/hanzoai/insights/bin/hobby-installer/ui"
)

var funFacts = []string{
	"Hanzo AI was founded in 2017 during Techstars",
	"The mascot mascot is named Max",
	"Insights is 100% open source - check out github.com/hanzoai/insights",
	"Insights supports 40+ data integrations out of the box",
	"You can run SQL queries directly on your Insights data",
	"Insights was built by engineers, for engineers",
	"Mascots can run up to 6 miles per hour!",
}

type WelcomeModel struct {
	isUpgrade bool
	factIndex int
	mascot  ui.Mascot
}

func NewWelcomeModel() WelcomeModel {
	isUpgrade := core.DirExists("insights")
	n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(funFacts))))
	return WelcomeModel{
		isUpgrade: isUpgrade,
		factIndex: int(n.Int64()),
		mascot:  ui.NewMascot(),
	}
}

func (m WelcomeModel) Init() tea.Cmd {
	return nil
}

func (m WelcomeModel) IsUpgrade() bool {
	return m.isUpgrade
}

func (m WelcomeModel) Update(msg tea.Msg) (WelcomeModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch {
		case key.Matches(msg, key.NewBinding(key.WithKeys("enter"))):
			mode := 0
			if m.isUpgrade {
				mode = 1
			}
			return m, func() tea.Msg {
				return StepCompleteMsg{Data: mode}
			}
		case key.Matches(msg, key.NewBinding(key.WithKeys("left", "h"))):
			m.factIndex--
			if m.factIndex < 0 {
				m.factIndex = len(funFacts) - 1
			}
		case key.Matches(msg, key.NewBinding(key.WithKeys("right", "l"))):
			m.factIndex++
			if m.factIndex >= len(funFacts) {
				m.factIndex = 0
			}
		case key.Matches(msg, key.NewBinding(key.WithKeys(" "))):
			m.mascot.Pet()
		case key.Matches(msg, key.NewBinding(key.WithKeys("q"))):
			return m, tea.Quit
		}
	}
	return m, nil
}

func (m WelcomeModel) View() string {
	// Section styles
	sectionGap := "\n\n"

	// Header section
	header := ui.GetWelcomeArt()

	// Mascot section - contained in its own area
	mascotSection := m.mascot.RenderWithMessage()

	// Action section - the main CTA
	actionTitle := lipgloss.NewStyle().
		Bold(true).
		Foreground(ui.ColorText).
		Render(m.getActionTitle())

	actionHint := lipgloss.NewStyle().
		Foreground(ui.ColorPrimary).
		Bold(true).
		Render("Press ENTER to continue")

	actionDesc := ui.MutedStyle.Render(m.getActionDescription())

	actionSection := lipgloss.JoinVertical(
		lipgloss.Center,
		actionTitle,
		actionDesc,
		"",
		actionHint,
	)

	// Fact section
	factSection := lipgloss.JoinVertical(
		lipgloss.Center,
		m.renderFactBox(),
		m.renderFactNav(),
	)

	// Help section
	helpSection := m.renderHelp()

	// Compose everything with generous spacing
	content := lipgloss.JoinVertical(
		lipgloss.Center,
		header,
		sectionGap,
		mascotSection,
		sectionGap,
		actionSection,
		sectionGap,
		factSection,
		sectionGap,
		helpSection,
	)

	return lipgloss.NewStyle().
		Padding(2, 6).
		Render(content)
}

func (m WelcomeModel) getActionTitle() string {
	if m.isUpgrade {
		return "Upgrade Insights"
	}
	return "Install Insights"
}

func (m WelcomeModel) getActionDescription() string {
	if m.isUpgrade {
		return "Existing installation detected"
	}
	return "Self-hosted deployment"
}

func (m WelcomeModel) renderFactBox() string {
	factLabel := ui.MutedStyle.Render("Did you know?")
	factText := lipgloss.NewStyle().
		Foreground(ui.ColorText).
		Width(56).
		Render(funFacts[m.factIndex])

	innerContent := lipgloss.JoinVertical(lipgloss.Left, factLabel, "", factText)

	return lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(ui.ColorMuted).
		Padding(1, 3).
		Render(innerContent)
}

func (m WelcomeModel) renderFactNav() string {
	left := ui.MutedStyle.Render("<")
	right := ui.MutedStyle.Render(">")
	counter := ui.MutedStyle.Render(fmt.Sprintf(" %d/%d ", m.factIndex+1, len(funFacts)))
	return left + counter + right
}

func (m WelcomeModel) renderHelp() string {
	// Style for keys
	keyStyle := lipgloss.NewStyle().
		Foreground(ui.ColorPrimary)

	// Style for descriptions
	descStyle := ui.MutedStyle

	separator := descStyle.Render("  •  ")

	items := []string{
		keyStyle.Render("enter") + descStyle.Render(" continue"),
		keyStyle.Render("< / >") + descStyle.Render(" facts"),
		keyStyle.Render("space") + descStyle.Render(" pet"),
		keyStyle.Render("q/esc") + descStyle.Render(" quit"),
	}

	return items[0] + separator + items[1] + separator + items[2] + separator + items[3]
}

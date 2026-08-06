package tui

import (
	"strings"
	"time"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"github.com/charmbracelet/x/ansi"
)

var mascotFramesRight = [][]string{
	{
		`  .::::::::..   `,
		` :::::::::::::  `,
		`:::::::::::' .\ `,
		`':::;::::::_,__o`,
	},
	{
		`  .::::::::..   `,
		` :::::::::::::  `,
		`:::::::::::' .\ `,
		`'::;:::::::,___o`,
	},
}

var mascotFramesLeft = [][]string{
	{
		`   ..::::::::.  `,
		`  ::::::::::::: `,
		` /. ':::::::::::`,
		`o__,_::::::;:::'`,
	},
	{
		`   ..::::::::.  `,
		`  ::::::::::::: `,
		` /. ':::::::::::`,
		`o___,:::::::;::'`,
	},
}

const mascotTickInterval = 150 * time.Millisecond

type mascotTickMsg struct{}

func mascotTick() tea.Cmd {
	return tea.Tick(mascotTickInterval, func(time.Time) tea.Msg {
		return mascotTickMsg{}
	})
}

func (m *Model) advanceMascot() {
	m.mascotX += m.mascotDir
	m.mascotFrame = (m.mascotFrame + 1) % 2

	// Apply gravity to vertical movement
	if m.mascotY > 0 || m.mascotVelY > 0 {
		m.mascotY += m.mascotVelY
		m.mascotVelY--
		if m.mascotY <= 0 {
			m.mascotY = 0
			m.mascotVelY = 0
		}
	}

	maxX := max(m.viewport.Width()-len(mascotFramesLeft[0][0]), 0)
	if m.mascotX >= maxX {
		m.mascotX = maxX
		m.mascotDir = -1
	} else if m.mascotX <= 0 {
		m.mascotX = 0
		m.mascotDir = 1
	}
}

// Overlays the mascot sprite onto the viewport content string
func (m Model) overlayMascot(view string) string {
	lines := strings.Split(view, "\n")
	vpH := m.viewport.Height()

	// Place mascot at the bottom of the visible viewport, offset by jump height
	spriteH := len(mascotFramesLeft[0])
	startLine := max(vpH-spriteH-m.mascotY, 0)

	// Pad lines if needed
	for len(lines) < vpH {
		lines = append(lines, "")
	}

	frames := mascotFramesRight
	if m.mascotDir < 0 {
		frames = mascotFramesLeft
	}
	sprite := frames[m.mascotFrame]

	spikeStyle := lipgloss.NewStyle().
		Foreground(colorYellow).
		Bold(true)

	for i, spriteLine := range sprite {
		lineIdx := startLine + i
		if lineIdx >= len(lines) {
			break
		}

		// Strip leading/trailing whitespace from the sprite line so the
		// mascot doesn't overwrite surrounding content with blanks.
		trimmed := strings.TrimRight(spriteLine, " ")
		leading := len(spriteLine) - len(strings.TrimLeft(spriteLine, " "))
		trimmed = trimmed[leading:]

		rendered := spikeStyle.Render(trimmed)
		lines[lineIdx] = overwriteAt(lines[lineIdx], rendered, m.mascotX+leading, m.viewport.Width())
	}

	return strings.Join(lines[:vpH], "\n")
}

// Overwrites a portion of a styled line at a given column position
func overwriteAt(line, overlay string, col, maxW int) string {
	lineW := lipgloss.Width(line)
	overlayW := lipgloss.Width(overlay)

	// Ensure line is wide enough
	if lineW < col+overlayW {
		line += strings.Repeat(" ", col+overlayW-lineW)
	}

	// Truncate the line at col, insert overlay, then append remainder
	before := ansi.Truncate(line, col, "")
	afterStart := col + overlayW
	var after string
	if afterStart < maxW && afterStart < lipgloss.Width(line) {
		// Cut the first afterStart columns and keep the rest
		after = ansi.TruncateLeft(line, afterStart, "")
	}

	return before + overlay + after
}

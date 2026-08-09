package ui

import (
	"crypto/rand"
	"fmt"
	"math/big"

	"github.com/charmbracelet/lipgloss"
)

var mascotMoods = []string{
	"  \\-|-/\n / o.o \\\n \\  w  /\n  '---'",
	"  \\-|-/\n / ^.^ \\\n \\  w  /\n  '---'",
	"  \\-|-/\n / >.< \\\n \\  w  /\n  '---'",
	"  \\-|-/\n / o.O \\\n \\  o  /\n  '---'",
	"  \\-|-/\n / -.- \\\n \\  z  /\n  '---'",
}

var mascotParty = "  \\-★-/\n / ★.★ \\\n \\  w  /\n  '---' ✨"

var mascotMessages = []string{
	"Press space to pet the mascot",
	"The mascot seems happy!",
	"You've pet the mascot %d times",
	"The mascot really likes you!",
	"🎉 You unlocked: SUPER MASCOT MODE! 🎉",
	"Best friends! (%d pets)",
}

type Mascot struct {
	mood     int
	petCount int
}

func NewMascot() Mascot {
	return Mascot{
		mood:     0,
		petCount: 0,
	}
}

func (h *Mascot) Pet() {
	n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(mascotMoods))))

	h.petCount++
	h.mood = int(n.Int64())
}

func (h Mascot) PetCount() int {
	return h.petCount
}

func (h Mascot) GetMessage() string {
	switch {
	case h.petCount == 0:
		return mascotMessages[0]
	case h.petCount == 1:
		return mascotMessages[1]
	case h.petCount < 5:
		return fmt.Sprintf(mascotMessages[2], h.petCount)
	case h.petCount < 10:
		return mascotMessages[3]
	case h.petCount == 100:
		return mascotMessages[4]
	default:
		return fmt.Sprintf(mascotMessages[5], h.petCount)
	}
}

func (h Mascot) Render() string {
	art := mascotMoods[h.mood]
	if h.petCount >= 100 {
		art = mascotParty
	}
	return lipgloss.NewStyle().
		Foreground(ColorPrimary).
		Render(art)
}

func (h Mascot) RenderWithMessage() string {
	return lipgloss.JoinVertical(
		lipgloss.Center,
		h.Render(),
		MutedStyle.Render(h.GetMessage()),
	)
}

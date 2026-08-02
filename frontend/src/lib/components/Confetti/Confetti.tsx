// The celebration keeps its trigger but draws nothing: every particle was one
// of upstream's mascot illustrations, which this product does not ship.
//
// The hook's shape is deliberately unchanged so callers stay untouched, and so
// a Hanzo particle would have exactly one place to land if we want the
// animation back. Until then there is no particle state and no animation frame,
// because a simulation whose every frame draws nothing is just a timer.
import React from 'react'

interface ConfettiOptions {
    count?: number
    power?: number
    duration?: number
    maxSize?: number
}

interface ConfettiHook {
    trigger: () => void
    ConfettiComponent: React.FC
}

export const useConfetti = (options: ConfettiOptions = {}): ConfettiHook => {
    void options
    return {
        trigger: () => {},
        ConfettiComponent: () => null,
    }
}

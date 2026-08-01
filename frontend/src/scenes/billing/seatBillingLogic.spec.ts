import { canCancelSeat, isAlphaPlanKey, isFreePlanKey, isProPlanKey, seatPriceFromPlanKey } from './seatBillingLogic'

describe('seatBillingLogic plan key helpers', () => {
    describe('isProPlanKey', () => {
        it.each([
            ['insights-code-pro-200-20260301', true],
            ['insights-code-pro-0-20260422', true],
            ['insights-code-pro-500-20270101', true],
            ['insights-code-free-20260301', false],
            ['insights-code-200-20260301', false],
            ['some-other-plan', false],
            ['', false],
            [null, false],
            [undefined, false],
        ])('isProPlanKey(%p) === %p', (planKey, expected) => {
            expect(isProPlanKey(planKey)).toBe(expected)
        })
    })

    describe('isAlphaPlanKey', () => {
        it.each([
            ['insights-code-pro-0-20260422', true],
            ['insights-code-pro-200-20260301', false],
            ['insights-code-pro-500-20270101', false],
            ['insights-code-free-20260301', false],
            ['some-other-plan', false],
            ['', false],
            [null, false],
            [undefined, false],
        ])('isAlphaPlanKey(%p) === %p', (planKey, expected) => {
            expect(isAlphaPlanKey(planKey)).toBe(expected)
        })
    })

    describe('isFreePlanKey', () => {
        it.each([
            ['insights-code-free-20260301', true],
            ['insights-code-free-20270101', true],
            ['insights-code-pro-200-20260301', false],
            ['insights-code-pro-0-20260422', false],
            ['some-other-plan', false],
            ['', false],
            [null, false],
            [undefined, false],
        ])('isFreePlanKey(%p) === %p', (planKey, expected) => {
            expect(isFreePlanKey(planKey)).toBe(expected)
        })
    })

    describe('seatPriceFromPlanKey', () => {
        it.each([
            ['insights-code-pro-200-20260301', 200],
            ['insights-code-pro-0-20260422', 0],
            ['insights-code-pro-500-20270101', 500],
            ['insights-code-free-20260301', 0],
            ['unrecognized-plan', 0],
        ])('seatPriceFromPlanKey(%p) === %p', (planKey, expected) => {
            expect(seatPriceFromPlanKey(planKey)).toBe(expected)
        })
    })

    describe('canCancelSeat', () => {
        it.each([
            ['active', true, true],
            ['active', false, false],
            ['canceling', true, false],
            ['expired', true, false],
        ] as const)('canCancelSeat({ status: %p }, %p) === %p', (status, isAdmin, expected) => {
            expect(canCancelSeat({ status }, isAdmin)).toBe(expected)
        })
    })
})

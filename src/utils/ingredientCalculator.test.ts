import { describe, expect, it } from 'vitest'
import {
  formatAmount,
  roundAmount,
  scaleAmount,
  scaleIngredient,
} from './ingredientCalculator'
import type { Ingredient } from '../types/recipe'

describe('scaleAmount', () => {
  it('1 → 2 servings 等比例放大', () => {
    expect(scaleAmount(200, 1, 2)).toBe(400)
  })

  it('2 → 4 servings', () => {
    expect(scaleAmount(200, 2, 4)).toBe(400)
  })

  it('4 → 1 serving 縮小', () => {
    expect(scaleAmount(400, 4, 1)).toBe(100)
  })

  it('不會被 originalServings 為 0 破壞', () => {
    expect(scaleAmount(100, 0, 4)).toBe(100)
  })
})

describe('roundAmount（rounding policy）', () => {
  it('整數保持整數', () => {
    expect(roundAmount(100)).toBe(100)
    expect(roundAmount(150)).toBe(150)
  })

  it('小於 10 保留至多 2 位小數', () => {
    expect(roundAmount(1.5)).toBe(1.5)
    expect(roundAmount(3.333)).toBe(3.33)
  })

  it('10 以上最多 1 位小數', () => {
    expect(roundAmount(33.333)).toBe(33.3)
  })

  it('接近整數時取整數（不要過度四捨五入）', () => {
    expect(roundAmount(2.25)).toBe(2.25)
    expect(roundAmount(10.05)).toBe(10.1)
    expect(roundAmount(9.98)).toBe(10)
  })

  it('處理 -0', () => {
    expect(Object.is(roundAmount(-0.03), 0)).toBe(true)
  })
})

describe('scaleIngredient', () => {
  const ing: Ingredient = { id: '1', name: '義大利麵', amount: 200, unit: 'g' }

  it('2 → 4 servings 計算並回傳新物件（不改原物件）', () => {
    const scaled = scaleIngredient(ing, 2, 4)
    expect(scaled.amount).toBe(400)
    expect(ing.amount).toBe(200)
  })

  it('1.5 tbsp → 2.25 tbsp', () => {
    const scaled = scaleIngredient(
      { id: '2', name: '醬油', amount: 1.5, unit: 'tbsp' },
      2,
      3,
    )
    expect(scaled.amount).toBe(2.25)
  })
})

describe('formatAmount', () => {
  it('整數不顯示小數點', () => {
    expect(formatAmount(200)).toBe('200')
  })

  it('小數最多 2 位並去除尾端 0', () => {
    expect(formatAmount(2.25)).toBe('2.25')
    expect(formatAmount(2.5)).toBe('2.5')
    expect(formatAmount(33.333)).toBe('33.3')
  })
})

import type { Ingredient } from '../types/recipe'

/**
 * 份量計算公式：
 *   newAmount = originalAmount * newServings / originalServings
 *
 * 資料庫只保存原始 amount，本函式只回傳「計算後」的數字，
 * 呼叫端不得把結果寫回資料庫。
 */
export function scaleAmount(
  originalAmount: number,
  originalServings: number,
  newServings: number,
): number {
  if (originalServings <= 0 || newServings <= 0) return originalAmount
  return (originalAmount * newServings) / originalServings
}

/**
 * Rounding policy（計畫 Phase 4）：
 * - 接近整數（差距 < 0.05）→ 取整數
 * - 小於 10 → 保留至多 2 位小數（保留 2.25 這類有意義的精度，不四捨五入）
 * - 10 以上 → 保留至多 1 位小數
 * - 不要過度四捨五入
 *
 * 100 → 100
 * 1.5 → 1.5
 * 2.25 → 2.25
 * 33.3333… → 33.3
 */
export function roundAmount(amount: number): number {
  if (!Number.isFinite(amount)) return amount

  const isCloseToInteger = Math.abs(amount - Math.round(amount)) < 0.05
  let result: number
  if (isCloseToInteger) {
    result = Math.round(amount)
  } else if (Math.abs(amount) < 10) {
    result = Math.round(amount * 100) / 100
  } else {
    result = Math.round(amount * 10) / 10
  }
  // 避免 -0
  return Object.is(result, -0) ? 0 : result
}

/** 縮放一份食材並四捨五入 */
export function scaleIngredient(
  ingredient: Ingredient,
  originalServings: number,
  newServings: number,
): Ingredient {
  return {
    ...ingredient,
    amount: roundAmount(
      scaleAmount(ingredient.amount, originalServings, newServings),
    ),
  }
}

/**
 * 把食材數量格式化為字串：
 * - 整數不顯示小數點
 * - 其餘最多顯示 2 位小數並去除尾端 0
 */
export function formatAmount(amount: number): string {
  if (!Number.isFinite(amount)) return String(amount)
  const rounded = roundAmount(amount)
  return Number.isInteger(rounded)
    ? String(rounded)
    : String(Math.round(rounded * 100) / 100)
}

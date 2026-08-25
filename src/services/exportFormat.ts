import type { Ingredient, Recipe } from '../types/recipe'

/**
 * 把 Recipe 序列化成「匯入固定格式」的文字。
 * 這樣使用者可以把 App 裡的食譜複製出去（例如貼回 LLM 再修改），
 * 之後再用同一套格式貼回來匯入。
 *
 * 格式與 importParser 相容：
 *   NAME / DESCRIPTION / SERVINGS / TAGS / INGREDIENTS / STEPS / NOTES
 */
export function toImportFormat(recipe: Pick<Recipe, 'name' | 'description' | 'servings' | 'ingredients' | 'steps' | 'tags' | 'notes'>): string {
  const lines: string[] = []
  lines.push(`NAME: ${recipe.name}`)
  if (recipe.description) lines.push(`DESCRIPTION: ${recipe.description}`)
  lines.push(`SERVINGS: ${recipe.servings}`)
  if (recipe.tags.length > 0) lines.push(`TAGS: ${recipe.tags.join(', ')}`)

  lines.push('INGREDIENTS:')
  for (const ing of recipe.ingredients) {
    lines.push(formatIngredient(ing))
  }

  lines.push('STEPS:')
  for (const step of recipe.steps) {
    lines.push(`${step.order + 1}. ${step.description}`)
  }

  if (recipe.notes) lines.push(`NOTES: ${recipe.notes}`)

  return lines.join('\n')
}

function formatIngredient(ing: Ingredient): string {
  // 份量為 0 且沒有單位 → 只輸出名稱
  if (ing.amount === 0 && !ing.unit) return `- ${ing.name}`
  return `- ${ing.name} | ${ing.amount} | ${ing.unit}`
}

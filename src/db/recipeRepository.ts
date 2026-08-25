import { db } from './database'
import type { Recipe } from '../types/recipe'

export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `recipe-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export async function createRecipe(recipe: Recipe): Promise<string> {
  return db.recipes.add(recipe)
}

export async function getRecipe(id: string): Promise<Recipe | undefined> {
  return db.recipes.get(id)
}

export async function getRecipes(): Promise<Recipe[]> {
  return db.recipes.orderBy('updatedAt').reverse().toArray()
}

export async function updateRecipe(recipe: Recipe): Promise<string> {
  return db.recipes.put(recipe)
}

export async function deleteRecipe(id: string): Promise<void> {
  await db.recipes.delete(id)
}

/**
 * 簡單搜尋：比對 name / tags / ingredient name（不分大小寫）。
 * 第一版不做全文搜尋引擎。
 */
export async function searchRecipes(query: string): Promise<Recipe[]> {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) {
    return getRecipes()
  }
  const all = await db.recipes.toArray()
  return all
    .filter((r) => {
      if (r.name.toLowerCase().includes(trimmed)) return true
      if (r.tags.some((t) => t.toLowerCase().includes(trimmed))) return true
      if (r.ingredients.some((i) => i.name.toLowerCase().includes(trimmed)))
        return true
      return false
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

/** 刪除全部（匯入時使用） */
export async function clearRecipes(): Promise<void> {
  await db.recipes.clear()
}

/** 匯入多筆（覆蓋既有相同 id） */
export async function bulkPutRecipes(recipes: Recipe[]): Promise<void> {
  await db.recipes.bulkPut(recipes)
}

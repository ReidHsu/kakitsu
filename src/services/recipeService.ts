import type { Recipe, RecipeDraft } from '../types/recipe'
import * as repo from '../db/recipeRepository'
import { generateId } from '../db/recipeRepository'

function nowIso(): string {
  return new Date().toISOString()
}

/** 建立一份完整的 Recipe（補上 id / 時間戳） */
export function buildRecipe(draft: RecipeDraft): Recipe {
  const timestamp = nowIso()
  return {
    id: draft.id ?? generateId(),
    name: draft.name.trim(),
    description: draft.description?.trim() || undefined,
    servings: Math.max(1, Math.round(draft.servings || 1)),
    ingredients: draft.ingredients,
    steps: draft.steps,
    tags: [...new Set(draft.tags.map((t) => t.trim()).filter(Boolean))],
    image: draft.image,
    reference: draft.reference?.trim() || undefined,
    notes: draft.notes?.trim() || undefined,
    favorite: draft.favorite ?? false,
    createdAt: draft.createdAt ?? timestamp,
    updatedAt: timestamp,
  }
}

export async function createRecipe(draft: RecipeDraft): Promise<string> {
  return repo.createRecipe(buildRecipe(draft))
}

export async function getRecipe(id: string): Promise<Recipe | undefined> {
  return repo.getRecipe(id)
}

export async function getRecipes(): Promise<Recipe[]> {
  return repo.getRecipes()
}

export async function updateRecipe(draft: RecipeDraft): Promise<string> {
  const existing = draft.id ? await repo.getRecipe(draft.id) : undefined
  const recipe = buildRecipe(draft)
  if (existing) {
    // 保留 createdAt 與原有的 favorite（若 UI 沒有變更）
    recipe.createdAt = existing.createdAt
  }
  return repo.updateRecipe(recipe)
}

export async function deleteRecipe(id: string): Promise<void> {
  await repo.deleteRecipe(id)
}

export async function searchRecipes(query: string): Promise<Recipe[]> {
  return repo.searchRecipes(query)
}

export async function toggleFavorite(id: string): Promise<void> {
  const recipe = await repo.getRecipe(id)
  if (!recipe) return
  await repo.updateRecipe({
    ...recipe,
    favorite: !recipe.favorite,
    updatedAt: nowIso(),
  })
}

export async function clearRecipes(): Promise<void> {
  await repo.clearRecipes()
}

export async function bulkPutRecipes(recipes: Recipe[]): Promise<void> {
  await repo.bulkPutRecipes(recipes)
}

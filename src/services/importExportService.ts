import type { Recipe, RecipeExportFile } from '../types/recipe'
import { EXPORT_FILE_VERSION } from '../types/recipe'
import { generateId } from '../db/recipeRepository'
import * as recipeService from './recipeService'

export interface ImportResult {
  imported: number
  updated: number
  skipped: number
}

export interface ExportResult {
  json: string
  filename: string
}

/** 取得要匯出的 JSON 與檔名 */
export async function buildExport(): Promise<ExportResult> {
  const recipes = await recipeService.getRecipes()
  const data: RecipeExportFile = {
    version: EXPORT_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    recipes,
  }
  const date = new Date().toISOString().slice(0, 10)
  return {
    json: JSON.stringify(data, null, 2),
    filename: `recipes-${date}.json`,
  }
}

/** 觸發瀏覽器下載 */
export function downloadJson(json: string, filename: string): void {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

/**
 * 驗證並清理單一 recipe。
 * 回傳合法 recipe，或 null（丟棄）。
 */
function sanitizeRecipe(raw: unknown): Recipe | null {
  if (!isPlainObject(raw)) return null
  if (!isNonEmptyString(raw.name)) return null

  const servings =
    typeof raw.servings === 'number' && raw.servings > 0
      ? Math.round(raw.servings)
      : 1

  const ingredients = Array.isArray(raw.ingredients)
    ? raw.ingredients
        .filter(isPlainObject)
        .map((i) => ({
          id: typeof i.id === 'string' && i.id ? i.id : generateId(),
          name: typeof i.name === 'string' ? i.name : '',
          amount: typeof i.amount === 'number' && isFinite(i.amount) ? i.amount : 0,
          unit: typeof i.unit === 'string' ? i.unit : '',
        }))
        .filter((i) => i.name.trim().length > 0)
    : []

  const steps = Array.isArray(raw.steps)
    ? raw.steps
        .filter(isPlainObject)
        .map((s, idx) => ({
          id:
            typeof s.id === 'string' && s.id
              ? s.id
              : String(idx),
          order:
            typeof s.order === 'number' && isFinite(s.order) ? s.order : idx,
          description:
            typeof s.description === 'string' ? s.description : '',
        }))
        .filter((s) => s.description.trim().length > 0)
    : []

  const tags = Array.isArray(raw.tags)
    ? raw.tags.filter((t): t is string => typeof t === 'string')
    : []

  const recipe: Recipe = {
    id: typeof raw.id === 'string' && raw.id ? raw.id : generateId(),
    name: raw.name.trim(),
    description:
      typeof raw.description === 'string' ? raw.description : undefined,
    servings,
    ingredients,
    steps,
    tags,
    image: typeof raw.image === 'string' ? raw.image : undefined,
    notes: typeof raw.notes === 'string' ? raw.notes : undefined,
    favorite: raw.favorite === true,
    createdAt:
      typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt:
      typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  }
  return recipe
}

/**
 * 解析 JSON 字串並驗證整份檔案。
 * 拋出錯誤（含原因）或回傳解析後的檔案。
 */
export function parseExport(rawJson: string): RecipeExportFile {
  if (typeof rawJson !== 'string' || rawJson.trim() === '') {
    throw new Error('檔案內容是空的')
  }
  let data: unknown
  try {
    data = JSON.parse(rawJson)
  } catch {
    throw new Error('這不是有效的 JSON 檔案')
  }
  if (!isPlainObject(data)) {
    throw new Error('JSON 格式不正確：應該是物件')
  }
  const version = data.version
  if (typeof version !== 'number' || version > EXPORT_FILE_VERSION) {
    throw new Error(
      `不支援的版本 v${String(version)}（目前支援至 v${EXPORT_FILE_VERSION}）`,
    )
  }
  if (!Array.isArray(data.recipes)) {
    throw new Error('JSON 缺少 recipes 陣列')
  }
  return {
    version,
    exportedAt:
      typeof data.exportedAt === 'string'
        ? data.exportedAt
        : new Date().toISOString(),
    recipes: data.recipes as unknown as Recipe[],
  }
}

/**
 * 匯入 recipes：existing 為目前資料庫中的 recipes 快照。
 * 相同 id 時改為覆寫（update），不同 id 時新增（create）。
 * 回傳處理結果統計。
 */
export async function importRecipes(rawJson: string): Promise<ImportResult> {
  const file = parseExport(rawJson)
  const existing = await recipeService.getRecipes()
  const existingById = new Map(existing.map((r) => [r.id, r]))

  let imported = 0
  let updated = 0
  let skipped = 0

  for (const raw of file.recipes) {
    const recipe = sanitizeRecipe(raw)
    if (!recipe) {
      skipped += 1
      continue
    }
    if (existingById.has(recipe.id)) {
      // 覆蓋：保留原本的 updatedAt？改為採用匯入檔的。
      await recipeService.updateRecipe(recipe)
      updated += 1
    } else {
      await recipeService.createRecipe(recipe)
      imported += 1
    }
  }

  return { imported, updated, skipped }
}

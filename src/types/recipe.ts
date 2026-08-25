/** 食譜食材 */
export interface Ingredient {
  id: string
  name: string
  amount: number
  unit: string
}

/** 食譜步驟 */
export interface RecipeStep {
  id: string
  order: number
  description: string
}

/** 食譜（資料庫只存原始份量，計算後數字不寫回） */
export interface Recipe {
  id: string
  name: string
  description?: string
  servings: number
  ingredients: Ingredient[]
  steps: RecipeStep[]
  tags: string[]
  /** 壓縮後的圖片 data URL 或 Blob URL */
  image?: string
  notes?: string
  favorite?: boolean
  createdAt: string
  updatedAt: string
}

/** 可被編輯的表單資料（與 Recipe 相同，但 allow 建構中狀態） */
export type RecipeDraft = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string
  createdAt?: string
  updatedAt?: string
}

/** Export / Import 的 JSON 格式 */
export interface RecipeExportFile {
  version: number
  exportedAt: string
  recipes: Recipe[]
}

export const EXPORT_FILE_VERSION = 1

/** 常用的份量單位 */
export const UNIT_OPTIONS = [
  'g',
  'kg',
  'ml',
  'l',
  'tbsp',
  'tsp',
  '杯',
  '顆',
  '瓣',
  '根',
  '片',
  '塊',
  '條',
  '包',
  '個',
  '隻',
  '少許',
  '適量',
  '',
] as const

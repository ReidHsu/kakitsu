import { describe, expect, it } from 'vitest'
import {
  parseExport,
  importRecipes,
  buildExport,
} from './importExportService'
import * as recipeService from './recipeService'
import type { Recipe } from '../types/recipe'

const sampleRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: 'r1',
  name: '番茄義大利麵',
  servings: 2,
  ingredients: [
    { id: 'i1', name: '義大利麵', amount: 200, unit: 'g' },
    { id: 'i2', name: '番茄', amount: 300, unit: 'g' },
  ],
  steps: [
    { id: 's1', order: 0, description: '煮麵' },
    { id: 's2', order: 1, description: '拌醬' },
  ],
  tags: ['Italian'],
  createdAt: '2026-08-25T00:00:00Z',
  updatedAt: '2026-08-25T00:00:00Z',
  ...overrides,
})

function validExport(recipes: unknown[]): string {
  return JSON.stringify({
    version: 1,
    exportedAt: '2026-08-25T10:00:00Z',
    recipes,
  })
}

describe('parseExport', () => {
  it('接受合法的匯出檔案', () => {
    const file = parseExport(validExport([sampleRecipe()]))
    expect(file.recipes.length).toBe(1)
  })

  it('空字串 → 錯誤', () => {
    expect(() => parseExport('')).toThrow('空的')
  })

  it('不是 JSON → 錯誤', () => {
    expect(() => parseExport('not-json')).toThrow('JSON')
  })

  it('缺少 recipes 陣列 → 錯誤', () => {
    expect(() => parseExport('{"version":1}')).toThrow('recipes')
  })

  it('較新的版本 → 錯誤', () => {
    expect(() =>
      parseExport(JSON.stringify({ version: 99, exportedAt: '', recipes: [] })),
    ).toThrow('版本')
  })
})

describe('importRecipes', () => {
  it('匯入新增 + 更新 + 略過無效資料', async () => {
    // 先建立一筆既有資料（相同 id 會被更新）
    await recipeService.createRecipe(sampleRecipe())
    const json = validExport([
      sampleRecipe({ name: '更新後的義大利麵' }), // 同 id → update
      sampleRecipe({ id: 'r2', name: '新食譜' }), // 新 id → insert
      { name: '', servings: 0 }, // invalid → skip
      'bad', // invalid → skip
    ])
    const result = await importRecipes(json)
    expect(result.updated).toBe(1)
    expect(result.imported).toBe(1)
    expect(result.skipped).toBe(2)

    const all = await recipeService.getRecipes()
    const r1 = all.find((r) => r.id === 'r1')
    expect(r1?.name).toBe('更新後的義大利麵')
    const r2 = all.find((r) => r.id === 'r2')
    expect(r2?.name).toBe('新食譜')
    // 清理
    await recipeService.clearRecipes()
  })

  it('invalid recipe 的 id 不會留下垃圾資料', async () => {
    await recipeService.clearRecipes()
    await importRecipes(validExport([{ name: 123 }]))
    const all = await recipeService.getRecipes()
    expect(all.length).toBe(0)
  })
})

describe('buildExport', () => {
  it('回傳可解析的 JSON', async () => {
    await recipeService.clearRecipes()
    await recipeService.createRecipe(sampleRecipe())
    const { json } = await buildExport()
    const parsed = JSON.parse(json)
    expect(parsed.version).toBe(1)
    expect(parsed.recipes.length).toBe(1)
    expect(parsed.exportedAt).toBeTruthy()
    await recipeService.clearRecipes()
  })
})

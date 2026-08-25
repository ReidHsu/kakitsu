import { describe, expect, it } from 'vitest'
import { buildGenericPrompt, buildImportPrompt, parseRecipeText, tryDecodeUrlEncoded } from './importParser'

describe('tryDecodeUrlEncoded', () => {
  it('解碼 URL-encoded 內容', () => {
    expect(tryDecodeUrlEncoded('NAME%3A%20%E6%B9%AF')).toBe('NAME: 湯')
  })
  it('一般文字原樣回傳（含字面 % 百分比）', () => {
    expect(tryDecodeUrlEncoded('5% 的鹽水')).toBe('5% 的鹽水')
  })
  it('支援重複 URL encoding 與加號空白', () => {
    expect(tryDecodeUrlEncoded('name%253A%2520%25E6%258F%2580%25E9%25BA%25B5')).toBe('name: 揀麵')
    expect(tryDecodeUrlEncoded('name%3A+%E6%8F%80%E9%BA%B5')).toBe('name: 揀麵')
  })
  it('解碼失敗時保留原文', () => {
    expect(tryDecodeUrlEncoded('100%zz')).toBe('100%zz')
  })
  it('parseRecipeText 自動解碼 URL-encoded 的食譜與三引號包裝', () => {
    const draft = parseRecipeText(
      '"""name%253A%2520%E7%85%AE%E9%BA%B5%5Cnservings%253A%25202%5Cningredients%253A%5Cn-%2520%E9%BA%B5%2520%257C%2520200%2520%257C%2520g"""',
    )
    expect(draft.name).toBe('煮麵')
    expect(draft.servings).toBe(2)
    expect(draft.ingredients[0].name).toBe('麵')
  })
})

describe('parseRecipeText', () => {
  it('解析安全固定格式', () => {
    const text = `[KAKITSU_RECIPE]
NAME = 番茄義大利麵
DESCRIPTION = 經典家常麵
REFERENCE = https://www.youtube.com/watch?v=abc123
SERVINGS = 2
TAGS = 義大利, 快速

[INGREDIENTS]
- 義大利麵 | 200 | g
- 番茄 | 2 | 顆
- 橄欖油 | 1 | tbsp
[STEPS]
1. 煮麵
2. 拌番茄
[NOTES]
加點羅勒更香
[/KAKITSU_RECIPE]`

    const draft = parseRecipeText(text)
    expect(draft.name).toBe('番茄義大利麵')
    expect(draft.description).toBe('經典家常麵')
    expect(draft.reference).toBe('https://www.youtube.com/watch?v=abc123')
    expect(draft.servings).toBe(2)
    expect(draft.tags).toEqual(['義大利', '快速'])
    expect(draft.ingredients).toHaveLength(3)
    expect(draft.ingredients[0]).toMatchObject({ name: '義大利麵', amount: 200, unit: 'g' })
    expect(draft.ingredients[1]).toMatchObject({ name: '番茄', amount: 2, unit: '顆' })
    expect(draft.steps).toHaveLength(2)
    expect(draft.steps[0].description).toBe('煮麵')
    expect(draft.steps[0].order).toBe(0)
    expect(draft.steps[1].order).toBe(1)
    expect(draft.notes).toBe('加點羅勒更香')
  })

  it('仍相容舊版冒號格式', () => {
    const draft = parseRecipeText('NAME: 舊格式\nSERVINGS: 2\nINGREDIENTS:\n- 麵 | 100 | g')
    expect(draft.name).toBe('舊格式')
    expect(draft.ingredients[0].name).toBe('麵')
  })

  it('解析 YouTube prompt 會提醒模型保留來源', () => {
    const prompt = buildImportPrompt('https://youtu.be/abc123')
    expect(prompt).toContain('YouTube')
    expect(prompt).toContain('REFERENCE =')
  })

  it('相容中文欄位名與「食材：」內文形式', () => {
    const text = `食譜名稱: 高蛋白雞胸
份量: 1
食材: 雞胸肉 | 300 | g, 鹽 | 1 | tsp
步驟:
1. 煎雞胸
2. 調味`

    const draft = parseRecipeText(text)
    expect(draft.name).toBe('高蛋白雞胸')
    expect(draft.servings).toBe(1)
    expect(draft.ingredients.map((i) => i.name)).toEqual(['雞胸肉', '鹽'])
    expect(draft.steps).toHaveLength(2)
  })

  it('容錯：份量＋單位在名稱前面、只有份量、只有名稱', () => {
    const text = `名稱: 簡易炒飯
食材:
- 200 g 白飯
- 2 顆蛋
- 蔥花`

    const draft = parseRecipeText(text)
    expect(draft.ingredients[0]).toMatchObject({ name: '白飯', amount: 200, unit: 'g' })
    expect(draft.ingredients[1]).toMatchObject({ name: '蛋', amount: 2, unit: '顆' })
    expect(draft.ingredients[2]).toMatchObject({ name: '蔥花', amount: 0, unit: '' })
  })

  it('忽略 markdown code fence，名稱可從第一行取得', () => {
    const text = `\`\`\`
NAME: 烤雞
SERVINGS: 3
INGREDIENTS:
- 全雞 | 1 | 隻
STEPS:
1. 預熱烤箱
\`\`\``

    const draft = parseRecipeText(text)
    expect(draft.name).toBe('烤雞')
    expect(draft.servings).toBe(3)
  })

  it('解析不出名稱時拋錯', () => {
    expect(() => parseRecipeText(''))
      .toThrow(/無法解析出食譜名稱/)
  })

  it('步進 order 依序重排', () => {
    const draft = parseRecipeText('名稱: X\n食材:\n- A\n步驟:\n1. 第一步\n2. 第二步\n3. 第三步')
    expect(draft.steps.map((s) => s.order)).toEqual([0, 1, 2])
  })
})

describe('buildGenericPrompt', () => {
  it('包含固定格式與規則', () => {
    const prompt = buildGenericPrompt()
    expect(prompt).toContain('固定格式範例')
    expect(prompt).toContain('[INGREDIENTS]')
    expect(prompt).toContain('食譜整理助手')
  })
})

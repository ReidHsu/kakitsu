import type { Ingredient, RecipeDraft, RecipeStep } from '../types/recipe'
import { generateId } from '../db/recipeRepository'

/** sessionStorage 橋接 key：Import 頁 → 編輯器 */
export const IMPORT_DRAFT_KEY = 'kakitsu-import-draft'

/**
 * 把 URL-encoded 文字解碼還原。
 * 有些 App（例如 Gemini 手機版）複製結果時會輸出成 %20%E6… 形式。
 * 只在偵測到 %XX 序列且能完整解碼時才處理；一般文字（如「5% 鹽水」）原樣回傳。
 */
export function tryDecodeUrlEncoded(text: string): string {
  let current = text

  // 有些手機 / LLM 會重複包一層 URL encoding，最多解兩層即可避免誤解碼。
  for (let i = 0; i < 2; i += 1) {
    if (!/[%][0-9A-Fa-f]{2}/.test(current)) break
    try {
      // URL form encoding 也可能用 + 表示空白。
      const decoded = decodeURIComponent(current.replace(/\+/g, ' '))
      if (decoded === current) break
      current = decoded
    } catch {
      // 內容含有不完整的 % 序列時，不要讓整段貼上失敗。
      break
    }
  }

  return current
}

/** 移除 Gemini / 其他 App 可能加上的三引號字串包裝。 */
function unwrapTransportQuotes(text: string): string {
  const trimmed = text.trim()
  if (
    (trimmed.startsWith('"""') && trimmed.endsWith('"""')) ||
    (trimmed.startsWith("'''") && trimmed.endsWith("'''"))
  ) {
    return trimmed.slice(3, -3).trim()
  }
  return trimmed
}

/**
 * 固定匯入格式範本（也是 prompt 給 LLM 看的範例）。
 * 使用不含冒號的欄位格式，避免手機把 NAME: 誤判為 URL scheme；parser 仍相容舊格式。
 */
export const IMPORT_FORMAT_TEMPLATE = `[KAKITSU_RECIPE]
NAME = 食譜名稱
DESCRIPTION = 一句話描述
REFERENCE = https://www.youtube.com/watch?v=...
SERVINGS = 2
TAGS = 標籤1, 標籤2

[INGREDIENTS]
- 食材名稱 | 份量 | 單位
- 食材名稱 | 份量 | 單位

[STEPS]
1. 步驟內容
2. 步驟內容

[NOTES]
備註
[/KAKITSU_RECIPE]`

const GENERIC_PROMPT = `你是「食譜整理助手」。之後我貼給你一份食譜文字或一道菜的名稱／描述時，請只回覆成下列固定格式，不要前言、不要說明、不要程式碼區塊。

重要：請完整保留 [KAKITSU_RECIPE] 與 [/KAKITSU_RECIPE] 標記；不要把固定格式改成 JSON、Markdown 表格或其他格式。

固定格式範例：
${IMPORT_FORMAT_TEMPLATE}

規則：
- NAME 必填，使用「欄位 = 內容」，不要使用冒號。
- REFERENCE 若來源是 YouTube 或其他網頁，填入完整網址；沒有來源就省略該行。
- DESCRIPTION、SERVINGS、TAGS 沒有資料就省略該行。
- 如果我提供 YouTube 網址，請分析影片內容、字幕或影片描述中的食譜資訊；無法確認的份量不要自行捏造，請放到 NOTES 說明。
- INGREDIENTS 每行是「食材名稱 | 份量 | 單位」。份量用數字；單位用 g、kg、ml、l、tbsp、tsp、杯、顆、瓣、根、片、塊、條、包、個、隻 等，真的沒有單位就留空。
- SERVINGS 要是整數，食材份量要對應到這個份量。
- STEPS 用數字編號，每行一個步驟。
- NOTES 沒有資料就省略整個區塊。
- 若我給的是菜名或描述而沒有現成食譜，請設計一份合理的食譜，輸出同樣格式。`

/** 可重複使用的通用 prompt（使用者自己貼給 LLM） */
export function buildGenericPrompt(): string {
  return GENERIC_PROMPT
}

/** 內嵌目前要轉換內容的一次性 prompt */
export function buildImportPrompt(userInput: string): string {
  const isYouTube = /(?:youtube\.com|youtu\.be)/i.test(userInput)
  const sourceHint = isYouTube
    ? '\n\n這是一個 YouTube 來源。請先分析影片中的食譜內容（字幕、影片描述或你能取得的資訊），並把原始網址放在 REFERENCE = 欄位。'
    : ''
  return `${GENERIC_PROMPT}${sourceHint}\n\n要轉換的內容：\n---\n${userInput}\n---`
}

/** 中文 / 英文欄位別名 → 正規 key */
const SECTION_ALIASES: Record<string, string[]> = {
  NAME: ['name', '名稱', '名字', '菜名', '食譜名稱'],
  REFERENCE: ['reference', '來源', '參考資料', '參考連結', '影片來源', '影片連結'],
  DESCRIPTION: ['description', '描述', '簡介'],
  SERVINGS: ['servings', '份量', '幾人份', '人數'],
  TAGS: ['tags', '標籤'],
  INGREDIENTS: ['ingredients', '食材', '材料', '原料'],
  STEPS: ['steps', '步驟', '做法', '作法', '料理方式'],
  NOTES: ['notes', '備註', '筆記', '小貼士'],
}

const SAFE_FIELD_RE = /^([a-z][a-z_]*)\s*=\s*(.*)$/i
const SAFE_SECTION_RE = /^\[([^\]]+)\]$/
const SAFE_END_RE = /^\[\/KAKITSU_RECIPE\]$/i

const ALIAS_ENTRIES = Object.entries(SECTION_ALIASES).flatMap(([key, aliases]) =>
  aliases.map((a) => ({ key, re: new RegExp(`^${escapeRegex(a)}\\s*[:：]\\s*(.*)$`, 'i') })),
)

interface ClassifiedLine {
  key: string
  value: string
  /** 例如「INGREDIENTS:」沒有內文 → 進入 section */
  isSection: boolean
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function classify(line: string): ClassifiedLine | null {
  const safeField = line.match(SAFE_FIELD_RE)
  if (safeField) {
    const alias = safeField[1].toLowerCase()
    const entry = ALIAS_ENTRIES.find(({ re }) => re.test(`${alias}:`))
    if (entry) return { key: entry.key, value: safeField[2].trim(), isSection: false }
  }

  const safeSection = line.match(SAFE_SECTION_RE)
  if (safeSection) {
    const alias = safeSection[1].toLowerCase()
    if (alias === 'kakitsu_recipe') return null
    const entry = Object.entries(SECTION_ALIASES).find(([, aliases]) =>
      aliases.some((item) => item.toLowerCase() === alias),
    )
    if (entry) return { key: entry[0], value: '', isSection: true }
  }

  for (const { key, re } of ALIAS_ENTRIES) {
    const m = line.match(re)
    if (m) return { key, value: m[1].trim(), isSection: m[1].trim() === '' }
  }
  return null
}

function parseTags(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[,，、;；]/)
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean),
    ),
  ]
}

function parseIngredientLine(line: string): Ingredient | null {
  const stripped = line.replace(/^[-*•·]\s*/, '').trim()
  if (!stripped) return null

  // 主要格式：name | amount | unit
  const parts = stripped.split(/\s*[|｜]\s*/).map((p) => p.trim())
  if (parts.length >= 2) {
    const [name, amountRaw, unitRaw] = parts
    if (!name) return null
    const amount = parseFloat(amountRaw.replace(/,/g, ''))
    return {
      id: generateId(),
      name,
      amount: Number.isNaN(amount) ? 0 : amount,
      unit: unitRaw ?? '',
    }
  }

  // 容錯："200 g 義大利麵"（英文單位）或 "2 顆蛋"（中文單位）
  const amtUnit = stripped.match(/^([\d.,]+)\s+([a-zA-Z]+|[顆瓣根片塊條包個隻只份])?\s*(.+)$/)
  if (amtUnit && amtUnit[2]) {
    const amount = parseFloat(amtUnit[1].replace(/,/g, ''))
    return {
      id: generateId(),
      name: amtUnit[3].trim(),
      amount: Number.isNaN(amount) ? 0 : amount,
      unit: amtUnit[2].trim(),
    }
  }

  // 容錯："200 義大利麵"（只有份量沒有單位）
  const amountOnly = stripped.match(/^([\d.,]+)\s+(.+)$/)
  if (amountOnly) {
    const amount = parseFloat(amountOnly[1].replace(/,/g, ''))
    return {
      id: generateId(),
      name: amountOnly[2].trim(),
      amount: Number.isNaN(amount) ? 0 : amount,
      unit: '',
    }
  }

  // 容錯：只有名稱
  return { id: generateId(), name: stripped, amount: 0, unit: '' }
}

function parseStepLine(line: string): RecipeStep | null {
  const stripped = line.replace(/^[-*•·]\s*/, '').trim()
  if (!stripped) return null
  const desc = stripped.replace(/^\d+\s*[.)、]\s*/, '').trim()
  if (!desc) return null
  return { id: generateId(), order: 0, description: desc }
}

/**
 * 把 LLM 回傳的「固定格式」文字解析成 RecipeDraft。
 * 對未知行採容錯（忽略），並相容中英文欄位名與 markdown code fence。
 * 解析不出名稱時拋出錯誤。
 */
export function parseRecipeText(text: string): RecipeDraft {
  // 兜底：若內容是 URL-encoded（例如從手機 App 複製），先解碼
  const decoded = tryDecodeUrlEncoded(unwrapTransportQuotes(text))
  // 某些傳輸層會把換行也編碼成字面「\\n」
  const normalized = decoded.replace(/\\r/g, '').replace(/\\n/g, '\n')

  const lines = normalized
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^```/.test(l))

  const draft: RecipeDraft = {
    name: '',
    servings: 2,
    ingredients: [],
    steps: [],
    tags: [],
  }

  let section: 'ingredients' | 'steps' | 'notes' | null = null

  for (const line of lines) {
    if (SAFE_END_RE.test(line)) {
      section = null
      break
    }

    const cls = classify(line)

    if (cls) {
      if (cls.isSection) {
        // 進入 section（INGREDIENTS: / STEPS:）
        section = cls.key === 'INGREDIENTS' ? 'ingredients' : cls.key === 'STEPS' ? 'steps' : cls.key === 'NOTES' ? 'notes' : null
        continue
      }
      // 內文直接跟在欄位名後面
      switch (cls.key) {
        case 'NAME':
          draft.name = cls.value
          break
        case 'DESCRIPTION':
          draft.description = cls.value
          break
        case 'REFERENCE':
          draft.reference = cls.value
          break
        case 'SERVINGS': {
          const n = parseFloat(cls.value)
          if (!Number.isNaN(n) && n > 0) draft.servings = Math.round(n)
          break
        }
        case 'TAGS':
          draft.tags = parseTags(cls.value)
          break
        case 'NOTES':
          draft.notes = cls.value
          break
        case 'INGREDIENTS': {
          // 「食材：A、B、C」內文直接當食材行
          const items = cls.value.split(/[,，、;；]/).map((s) => s.trim())
          for (const item of items) {
            const ing = parseIngredientLine(item)
            if (ing) draft.ingredients.push(ing)
          }
          break
        }
        case 'STEPS': {
          const items = cls.value.split(/[,，、;；]/).map((s) => s.trim())
          for (const item of items) {
            const step = parseStepLine(item)
            if (step) draft.steps.push(step)
          }
          break
        }
      }
      // 遇到任何欄位名就離開 section（避免殘留）
      section = null
      continue
    }

    if (section === 'ingredients') {
      const ing = parseIngredientLine(line)
      if (ing) draft.ingredients.push(ing)
      continue
    }
    if (section === 'steps') {
      const step = parseStepLine(line)
      if (step) draft.steps.push(step)
      continue
    }
    if (section === 'notes') {
      draft.notes = draft.notes ? `${draft.notes}\n${line}` : line
      continue
    }
    // 其他未知行：忽略（容錯）
  }

  // 重新編排 step order
  draft.steps.forEach((s, idx) => {
    s.order = idx
  })

  // 名稱：優先 NAME；找不到時退回「第一個非欄位、非列表」的行
  if (!draft.name.trim()) {
    const fallback = lines.find((l) => {
      if (classify(l)) return false
      if (/^[-*•·]\s*/.test(l)) return false
      if (/^\d+\s*[.)、]\s*/.test(l)) return false
      return true
    })
    if (fallback) {
      draft.name = fallback.replace(/^[#*\s]+/, '').trim()
    }
  }

  if (!draft.name.trim()) {
    throw new Error('無法解析出食譜名稱。請確認內容有「NAME」或「名稱」欄位。')
  }

  return draft
}

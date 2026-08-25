import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, SectionTitle, TextArea } from '../components/ui'
import {
  buildGenericPrompt,
  buildImportPrompt,
  IMPORT_DRAFT_KEY,
  parseRecipeText,
  tryDecodeUrlEncoded,
} from '../services/importParser'

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // fallback
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

export function RecipeImportPage() {
  const navigate = useNavigate()
  const [recipeInput, setRecipeInput] = useState('')
  const [llmOutput, setLlmOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const genericPrompt = useMemo(buildGenericPrompt, [])

  const buildPromptWithInput = () =>
    recipeInput.trim()
      ? buildImportPrompt(recipeInput.trim())
      : genericPrompt

  const handleCopyGeneric = async () => {
    const ok = await copyText(genericPrompt)
    setCopied(ok ? '通用 Prompt 已複製' : '複製失敗，請手動選取')
  }

  const handleCopyWithInput = async () => {
    if (!recipeInput.trim()) {
      setError('請先在上方貼上或描述你的食譜 / 菜名')
      return
    }
    setError(null)
    const ok = await copyText(buildPromptWithInput())
    setCopied(ok ? 'Prompt（含你的內容）已複製' : '複製失敗，請手動選取')
  }

  const handleParse = () => {
    setError(null)
    try {
      const draft = parseRecipeText(llmOutput)
      // 橋接給編輯器
      sessionStorage.setItem(IMPORT_DRAFT_KEY, JSON.stringify(draft))
      navigate('/recipe/new')
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析失敗')
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-safe">
      <div className="flex items-center py-4">
        <Link to="/" className="mr-3 text-gray-600 dark:text-gray-300">
          ←
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          🤖 匯入食譜
        </h1>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {/* 步驟 1：取得 Prompt */}
      <section className="mb-6">
        <SectionTitle>① 複製 Prompt 給 AI</SectionTitle>
        <Card className="p-4">
          <div className="mb-3">
            <TextArea
              rows={4}
              value={recipeInput}
              onChange={(e) => setRecipeInput(e.target.value)}
              placeholder="貼上你的食譜文字，或只要輸入菜名 / 描述，例如「高蛋白雞胸肉義大利麵」"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleCopyGeneric}>
              📄 複製通用 Prompt
            </Button>
            <Button onClick={handleCopyWithInput}>
              ✨ 產生含內容的 Prompt
            </Button>
          </div>
          {copied ? (
            <p className="mt-2 text-sm text-green-700 dark:text-green-400">{copied}</p>
          ) : null}
        </Card>
      </section>

      {/* 步驟 2：把 AI 回傳貼回這裡 */}
      <section className="mb-6">
        <SectionTitle>② 把 AI 回傳的格式貼到這裡</SectionTitle>
        <Card className="p-4">
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
            把 Gemini / ChatGPT 回傳的「固定格式」內容貼到下面，App 會自動轉成食譜並帶進編輯器。
          </p>
          <div className="mb-3">
            <TextArea
              rows={8}
              value={llmOutput}
              onChange={(e) => setLlmOutput(e.target.value)}
              onPaste={(e) => {
                // 手機 / 部分平台複製出來是 URL-encoded（%20%E6…），貼上時直接解碼還原
                const raw = e.clipboardData.getData('text/plain')
                const decoded = tryDecodeUrlEncoded(raw)
                if (decoded !== raw) {
                  e.preventDefault()
                  setLlmOutput(decoded)
                }
              }}
              placeholder={'NAME: 番茄義大利麵\nSERVINGS: 2\nINGREDIENTS:\n- 義大利麵 | 200 | g\n...'}
            />
          </div>
          <Button onClick={handleParse} disabled={!llmOutput.trim()}>
            ➡️ 解析並填到編輯器
          </Button>
        </Card>
      </section>

      {/* 通用 Prompt 範例 */}
      <section>
        <SectionTitle>通用 Prompt（可先複製到 Gemini / ChatGPT）</SectionTitle>
        <Card className="p-4">
          <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
            把下面這段貼給 AI 一次，之後它就會照固定格式回覆。
          </p>
          <pre className="max-h-64 overflow-auto rounded-xl bg-gray-100 p-3 text-xs whitespace-pre-wrap text-gray-800 dark:bg-gray-800 dark:text-gray-200">
            {genericPrompt}
          </pre>
        </Card>
      </section>
    </div>
  )
}

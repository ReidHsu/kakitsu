import { useMemo, useState } from 'react'
import { Button, Card, SectionTitle, TextArea } from './ui'
import {
  buildGenericPrompt,
  buildImportPrompt,
  parseRecipeText,
  tryDecodeUrlEncoded,
} from '../services/importParser'
import type { RecipeDraft } from '../types/recipe'

interface RecipeAiImportProps {
  onParsed: (draft: RecipeDraft) => void
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

export function RecipeAiImport({ onParsed }: RecipeAiImportProps) {
  const [recipeInput, setRecipeInput] = useState('')
  const [llmOutput, setLlmOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [decodedNotice, setDecodedNotice] = useState<string | null>(null)
  const genericPrompt = useMemo(buildGenericPrompt, [])
  const looksEncoded = tryDecodeUrlEncoded(llmOutput) !== llmOutput

  const handleCopy = async (text: string, message: string) => {
    const ok = await copyText(text)
    setCopied(ok ? message : '複製失敗，請手動選取')
  }

  const handleParse = () => {
    setError(null)
    try {
      onParsed(parseRecipeText(llmOutput))
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析失敗')
    }
  }

  const handleDecodeCurrent = () => {
    const decoded = tryDecodeUrlEncoded(llmOutput)
    if (decoded !== llmOutput) {
      setLlmOutput(decoded)
      setDecodedNotice('✨ 已自動解碼：來源是 URL-encoded，已還原成正常文字')
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-green-50/50 p-4 dark:border-green-900 dark:bg-green-950/20">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          貼上菜名、食譜描述，或 YouTube 影片網址，複製 Prompt 給 Gemini / ChatGPT；再把 AI 回傳的固定格式貼回來。
        </p>
      </Card>

      <section>
        <SectionTitle>① 複製 Prompt 給 AI</SectionTitle>
        <Card className="p-4">
          <TextArea
            rows={4}
            value={recipeInput}
            onChange={(e) => setRecipeInput(e.target.value)}
            placeholder="例如：高蛋白雞胸肉義大利麵，或貼上 YouTube 網址"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => handleCopy(genericPrompt, '通用 Prompt 已複製')}
            >
              📄 複製通用 Prompt
            </Button>
            <Button
              onClick={() => {
                if (!recipeInput.trim()) {
                  setError('請先輸入菜名、食譜描述或 YouTube 網址')
                  return
                }
                setError(null)
                void handleCopy(
                  buildImportPrompt(recipeInput.trim()),
                  'Prompt（含內容）已複製',
                )
              }}
            >
              ✨ 產生含內容的 Prompt
            </Button>
          </div>
          {copied ? <p className="mt-2 text-sm text-green-700 dark:text-green-400">{copied}</p> : null}
        </Card>
      </section>

      <section>
        <SectionTitle>② 貼回 AI 的固定格式結果</SectionTitle>
        <Card className="p-4">
          <TextArea
            rows={9}
            value={llmOutput}
            onChange={(e) => setLlmOutput(e.target.value)}
            onPaste={(e) => {
              const raw = e.clipboardData.getData('text/plain')
              const decoded = tryDecodeUrlEncoded(raw)
              if (decoded !== raw) {
                e.preventDefault()
                setLlmOutput(decoded)
                setDecodedNotice('✨ 已自動解碼：來源是 URL-encoded，已還原成正常文字')
              }
            }}
            placeholder={'[KAKITSU_RECIPE]\nNAME = 番茄義大利麵\nREFERENCE = https://www.youtube.com/watch?v=...\nSERVINGS = 2\n[INGREDIENTS]\n- 義大利麵 | 200 | g\n...'}
          />
          {decodedNotice ? <p className="mt-1.5 text-sm text-green-700 dark:text-green-400">{decodedNotice}</p> : null}
          {looksEncoded ? (
            <p className="mt-1.5 text-sm text-amber-700 dark:text-amber-400">
              看起來仍是 URL-encoded，可點
              <button type="button" className="ml-1 font-semibold underline" onClick={handleDecodeCurrent}>
                🪄 手動解碼
              </button>
            </p>
          ) : null}
          <Button className="mt-3" onClick={handleParse} disabled={!llmOutput.trim()}>
            ➡️ 解析並填入下方表單
          </Button>
        </Card>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <details className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <summary className="cursor-pointer text-sm font-semibold">查看通用 Prompt</summary>
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-gray-100 p-3 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          {genericPrompt}
        </pre>
      </details>
    </div>
  )
}

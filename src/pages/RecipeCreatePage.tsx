import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RecipeForm } from '../components/RecipeForm'
import { RecipeAiImport } from '../components/RecipeAiImport'
import { IMPORT_DRAFT_KEY } from '../services/importParser'
import * as recipeService from '../services/recipeService'
import type { RecipeDraft } from '../types/recipe'

type CreateMode = 'ai' | 'manual'

/** 讀取匯入流程帶過來的草稿（sessionStorage），並即時清掉 */
function readImportDraft(): RecipeDraft | undefined {
  try {
    const raw = sessionStorage.getItem(IMPORT_DRAFT_KEY)
    if (!raw) return undefined
    sessionStorage.removeItem(IMPORT_DRAFT_KEY)
    return JSON.parse(raw) as RecipeDraft
  } catch {
    return undefined
  }
}

export function RecipeCreatePage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [mode, setMode] = useState<CreateMode>('ai')
  const [importedDraft] = useState(readImportDraft)
  const [aiDraft, setAiDraft] = useState<RecipeDraft | undefined>(importedDraft)

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-safe">
      <div className="flex items-center py-4">
        <Link to="/" className="mr-3 text-gray-600 dark:text-gray-300">
          ←
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          建立食譜
        </h1>
      </div>

      <div className="mb-6 grid grid-cols-2 rounded-2xl bg-gray-200 p-1 dark:bg-gray-800" role="tablist" aria-label="建立方式">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'ai'}
          className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${mode === 'ai' ? 'bg-white text-green-700 shadow-sm dark:bg-gray-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setMode('ai')}
        >
          🤖 AI 產生（推薦）
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'manual'}
          className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${mode === 'manual' ? 'bg-white text-green-700 shadow-sm dark:bg-gray-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setMode('manual')}
        >
          ✍️ 手動建立
        </button>
      </div>

      {mode === 'ai' ? (
        <RecipeAiImport
          onParsed={(draft) => {
            setAiDraft(draft)
            setMode('manual')
          }}
        />
      ) : (
        <RecipeForm
          initial={aiDraft}
          submitLabel="儲存食譜"
          submitting={submitting}
          onSubmit={async (draft) => {
            setSubmitting(true)
            const id = await recipeService.createRecipe(draft)
            navigate(`/recipe/${id}`)
          }}
        />
      )}
    </div>
  )
}

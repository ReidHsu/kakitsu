import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RecipeForm } from '../components/RecipeForm'
import { IMPORT_DRAFT_KEY } from '../services/importParser'
import * as recipeService from '../services/recipeService'

/** 讀取匯入流程帶過來的草稿（sessionStorage），並即時清掉 */
function readImportDraft() {
  try {
    const raw = sessionStorage.getItem(IMPORT_DRAFT_KEY)
    if (!raw) return undefined
    sessionStorage.removeItem(IMPORT_DRAFT_KEY)
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

export function RecipeCreatePage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [importedDraft] = useState(readImportDraft)

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-safe">
      <div className="flex items-center py-4">
        <Link to="/" className="mr-3 text-gray-600 dark:text-gray-300">
          ←
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          New Recipe
        </h1>
      </div>

      <RecipeForm
        initial={importedDraft}
        submitLabel="儲存食譜"
        submitting={submitting}
        onSubmit={async (draft) => {
          setSubmitting(true)
          const id = await recipeService.createRecipe(draft)
          navigate(`/recipe/${id}`)
        }}
      />
    </div>
  )
}

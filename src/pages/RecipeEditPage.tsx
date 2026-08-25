import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { RecipeForm } from '../components/RecipeForm'
import { db } from '../db/database'
import * as recipeService from '../services/recipeService'

export function RecipeEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const recipe = useLiveQuery(async () => (id ? db.recipes.get(id) : undefined), [id])

  if (recipe === undefined) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 pt-safe">
        <div className="py-6">
          <Link to="/" className="text-sm text-gray-500">
            ← 返回
          </Link>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-40 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 pt-safe">
        <div className="py-6">
          <Link to="/" className="text-sm text-gray-500">
            ← 返回
          </Link>
        </div>
        <p className="text-gray-500">找不到這份食譜。</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-safe">
      <div className="flex items-center py-4">
        <Link to={`/recipe/${recipe.id}`} className="mr-3 text-gray-600 dark:text-gray-300">
          ←
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          編輯食譜
        </h1>
      </div>

      <RecipeForm
        initial={recipe}
        submitLabel="儲存變更"
        submitting={submitting}
        onSubmit={async (draft) => {
          setSubmitting(true)
          await recipeService.updateRecipe({ ...draft, id: recipe.id })
          navigate(`/recipe/${recipe.id}`)
        }}
      />
    </div>
  )
}

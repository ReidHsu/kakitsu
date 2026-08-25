import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ServingSelector } from '../components/ServingSelector'
import { Button, EmptyState, IconButton, SectionTitle, Tag } from '../components/ui'
import { db } from '../db/database'
import * as recipeService from '../services/recipeService'
import { formatAmount, scaleIngredient } from '../utils/ingredientCalculator'

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [servings, setServings] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  const recipe = useLiveQuery(async () => (id ? db.recipes.get(id) : undefined), [id])

  if (recipe === undefined) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pt-safe">
        <div className="py-6">
          <Link to="/" className="text-sm text-gray-500">
            ← 返回
          </Link>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-700" />
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
        <EmptyState icon="🤔" title="找不到食譜" hint="它可能已被刪除" />
      </div>
    )
  }

  const activeServings = servings ?? recipe.servings
  const scaledIngredients = recipe.ingredients.map((ing) =>
    scaleIngredient(ing, recipe.servings, activeServings),
  )

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setBusy(true)
    await recipeService.deleteRecipe(recipe.id)
    navigate('/')
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-safe">
      {/* 頂部列 */}
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between bg-gray-50/90 px-4 py-3 backdrop-blur dark:bg-gray-900/90">
        <Link to="/" className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
          ←
        </Link>
        <div className="flex items-center gap-1">
          <IconButton
            aria-label={recipe.favorite ? '取消最愛' : '設為最愛'}
            onClick={async () => {
              await recipeService.toggleFavorite(recipe.id)
            }}
          >
            {recipe.favorite ? '⭐' : '☆'}
          </IconButton>
          <IconButton
            aria-label="編輯食譜"
            onClick={() => navigate(`/recipe/${recipe.id}/edit`)}
          >
            ✏️
          </IconButton>
          <IconButton aria-label="刪除食譜" onClick={handleDelete} disabled={busy}>
            🗑️
          </IconButton>
        </div>
      </div>

      {confirmDelete ? (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/30">
          <span className="text-sm text-red-700 dark:text-red-300">確定刪除？</span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={busy}>
              刪除
            </Button>
          </div>
        </div>
      ) : null}

      {/* 圖片 */}
      {recipe.image ? (
        <img
          src={recipe.image}
          alt={recipe.name}
          className="mb-4 aspect-[4/3] w-full rounded-2xl object-cover"
        />
      ) : null}

      {/* 標題 */}
      <div className="mb-2 flex items-center gap-2">
        {recipe.favorite ? <span className="text-xl">⭐</span> : null}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {recipe.name}
        </h1>
      </div>
      {recipe.description ? (
        <p className="mb-2 text-gray-600 dark:text-gray-300">{recipe.description}</p>
      ) : null}
      {recipe.tags.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {recipe.tags.map((tag) => (
            <Tag key={tag}>#{tag}</Tag>
          ))}
        </div>
      ) : null}

      {/* 份量切換 */}
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          份量
        </span>
        <ServingSelector servings={activeServings} onChange={setServings} />
      </div>

      {/* 食材 */}
      <SectionTitle>食材</SectionTitle>
      {scaledIngredients.length === 0 ? (
        <p className="mb-4 text-sm text-gray-400">沒有食材</p>
      ) : (
        <ul className="mb-6 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
          {scaledIngredients.map((ing) => (
            <li key={ing.id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-16 shrink-0 text-right text-base font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                {formatAmount(ing.amount)}
              </span>
              <span className="w-12 shrink-0 text-sm text-gray-500 dark:text-gray-400">
                {ing.unit}
              </span>
              <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-200">
                {ing.name}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* 步驟 */}
      <SectionTitle>步驟</SectionTitle>
      {recipe.steps.length === 0 ? (
        <p className="mb-6 text-sm text-gray-400">沒有步驟</p>
      ) : (
        <ol className="mb-6 flex flex-col gap-3">
          {recipe.steps.map((step) => (
            <li key={step.id} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                {step.order + 1}
              </span>
              <p className="text-gray-700 dark:text-gray-200">{step.description}</p>
            </li>
          ))}
        </ol>
      )}

      {/* 備註 */}
      {recipe.notes ? (
        <>
          <SectionTitle>備註</SectionTitle>
          <p className="mb-6 whitespace-pre-wrap rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-100">
            {recipe.notes}
          </p>
        </>
      ) : null}

      {/* 底部動作 */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          className="flex-1 py-3"
          onClick={() => navigate(`/recipe/${recipe.id}/edit`)}
        >
          ✏️ 編輯
        </Button>
        <Button variant="danger" className="flex-1 py-3" onClick={handleDelete}>
          🗑️ 刪除
        </Button>
      </div>
    </div>
  )
}

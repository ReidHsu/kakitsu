import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { RecipeList } from '../components/RecipeList'
import { TextInput } from '../components/ui'
import { db } from '../db/database'
import { useTheme } from '../hooks/useTheme'
import * as recipeService from '../services/recipeService'

export function RecipeListPage() {
  const [query, setQuery] = useState('')
  const [dark, toggleDark] = useTheme()

  // 有搜尋詞時用即時搜尋，否則直接訂閱全部食譜（由 updatedAt 排序）
  const recipes = useLiveQuery(async () => {
    if (query.trim()) {
      return recipeService.searchRecipes(query)
    }
    return db.recipes.orderBy('updatedAt').reverse().toArray()
  }, [query])

  const loading = recipes === undefined

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-32 pt-safe">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          🍳 My Recipes
        </h1>
        <button
          type="button"
          aria-label={dark ? '切換到淺色模式' : '切換到深色模式'}
          className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          onClick={toggleDark}
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </header>

      <div className="mb-4">
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 搜尋食譜、標籤或食材…"
          aria-label="搜尋食譜"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      ) : (
        <RecipeList recipes={recipes ?? []} query={query} />
      )}
    </div>
  )
}

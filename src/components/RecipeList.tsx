import type { Recipe } from '../types/recipe'
import { EmptyState } from './ui'
import { RecipeCard } from './RecipeCard'

interface RecipeListProps {
  recipes: Recipe[]
  query: string
}

export function RecipeList({ recipes, query }: RecipeListProps) {
  if (recipes.length === 0) {
    return query.trim() ? (
      <EmptyState icon="🔍" title="找不到食譜" hint={`沒有符合「${query.trim()}」的結果`} />
    ) : (
      <EmptyState icon="🍳" title="還沒有食譜" hint="按下下方 + 新增你的第一道菜" />
    )
  }
  return (
    <div className="flex flex-col gap-3">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  )
}

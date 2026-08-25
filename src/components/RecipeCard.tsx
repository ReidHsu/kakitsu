import { Link } from 'react-router-dom'
import type { Recipe } from '../types/recipe'
import { Tag } from './ui'

interface RecipeCardProps {
  recipe: Recipe
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const latestStep = recipe.steps[0]
  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className="flex overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md active:scale-[0.99] dark:border-gray-700 dark:bg-gray-800"
    >
      {recipe.image ? (
        <img
          src={recipe.image}
          alt={recipe.name}
          className="h-24 w-24 shrink-0 object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center bg-green-50 text-3xl dark:bg-green-900/30">
          🍳
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3">
        <div className="flex items-center gap-1.5">
          {recipe.favorite ? <span aria-label="最愛">⭐</span> : null}
          <h3 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
            {recipe.name}
          </h3>
        </div>
        {latestStep ? (
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">
            {latestStep.description}
          </p>
        ) : null}
        {recipe.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.slice(0, 3).map((tag) => (
              <Tag key={tag}>#{tag}</Tag>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  )
}

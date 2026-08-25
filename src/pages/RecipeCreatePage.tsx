import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RecipeForm } from '../components/RecipeForm'
import * as recipeService from '../services/recipeService'

export function RecipeCreatePage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

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

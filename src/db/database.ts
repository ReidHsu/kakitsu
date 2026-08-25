import Dexie, { type Table } from 'dexie'
import type { Recipe } from '../types/recipe'

export class RecipeDatabase extends Dexie {
  recipes!: Table<Recipe, string>

  constructor() {
    super('RecipeDatabase')

    this.version(1).stores({
      recipes: 'id, name, createdAt, updatedAt, favorite',
    })
  }
}

export const db = new RecipeDatabase()

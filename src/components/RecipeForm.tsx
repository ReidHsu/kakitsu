import { useRef, useState } from 'react'
import type { Ingredient, RecipeDraft, RecipeStep } from '../types/recipe'
import { UNIT_OPTIONS } from '../types/recipe'
import { processImage } from '../services/imageService'
import { Button, SectionTitle, Select, Tag, TextArea, TextInput } from './ui'

interface RecipeFormProps {
  /** 編輯既有食譜時帶入；新增時省略 */
  initial?: RecipeDraft
  onSubmit: (draft: RecipeDraft) => Promise<void>
  submitLabel?: string
  submitting?: boolean
}

function newIngredient(): Ingredient {
  return { id: crypto.randomUUID(), name: '', amount: 0, unit: '' }
}

function newStep(order: number): RecipeStep {
  return { id: crypto.randomUUID(), order, description: '' }
}

export function RecipeForm({
  initial,
  onSubmit,
  submitLabel = '儲存',
  submitting = false,
}: RecipeFormProps) {
  const [draft, setDraft] = useState<RecipeDraft>(() => {
    const base: RecipeDraft = {
      name: '',
      servings: 2,
      ingredients: [newIngredient()],
      steps: [newStep(0)],
      tags: [],
    }
    return initial ? { ...base, ...initial } : base
  })
  const [tagInput, setTagInput] = useState('')
  const [imagePreview, setImagePreview] = useState<string | undefined>(
    initial?.image,
  )
  const [imageBusy, setImageBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof RecipeDraft>(key: K, value: RecipeDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  // ---- Ingredients ----
  const updateIngredient = (id: string, patch: Partial<Ingredient>) =>
    set(
      'ingredients',
      draft.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    )
  const removeIngredient = (id: string) =>
    set(
      'ingredients',
      draft.ingredients.filter((i) => i.id !== id),
    )

  // ---- Steps ----
  const updateStep = (id: string, patch: Partial<RecipeStep>) =>
    set('steps', draft.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  const removeStep = (id: string) =>
    set(
      'steps',
      draft.steps
        .filter((s) => s.id !== id)
        .map((s, idx) => ({ ...s, order: idx })),
    )

  // ---- Tags ----
  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '')
    if (!t) return
    if (!draft.tags.includes(t)) set('tags', [...draft.tags, t])
    setTagInput('')
  }

  // ---- Image ----
  const handleImageChange = async (file: File | undefined) => {
    if (!file) return
    setImageBusy(true)
    try {
      const dataUrl = await processImage(file)
      setImagePreview(dataUrl)
      set('image', dataUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : '圖片處理失敗')
    } finally {
      setImageBusy(false)
    }
  }

  // ---- Submit ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.name.trim()) {
      setError('請填寫食譜名稱')
      return
    }
    const clean: RecipeDraft = {
      ...draft,
      name: draft.name.trim(),
      description: draft.description?.trim() || undefined,
      notes: draft.notes?.trim() || undefined,
      ingredients: draft.ingredients.filter(
        (i) => i.name.trim() && (i.amount !== 0 || i.unit),
      ),
      steps: draft.steps.filter((s) => s.description.trim()),
      tags: [...new Set(draft.tags.filter(Boolean))],
      servings: Math.max(1, Math.round(draft.servings)),
    }
    setError(null)
    await onSubmit(clean)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {/* 圖片 */}
      <div>
        <SectionTitle>圖片</SectionTitle>
        <div className="flex items-center gap-3">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="預覽"
              className="h-20 w-20 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gray-100 text-3xl dark:bg-gray-700">
              🍳
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageChange(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={imageBusy}
              onClick={() => fileInputRef.current?.click()}
            >
              {imageBusy ? '處理中…' : imagePreview ? '更換圖片' : '選擇圖片'}
            </Button>
            {imagePreview ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setImagePreview(undefined)
                  set('image', undefined)
                }}
              >
                移除圖片
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* 名稱 */}
      <div>
        <SectionTitle>名稱 *</SectionTitle>
        <TextInput
          value={draft.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="例如：番茄義大利麵"
        />
      </div>

      {/* 描述 */}
      <div>
        <SectionTitle>描述</SectionTitle>
        <TextArea
          rows={2}
          value={draft.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          placeholder="簡單描述這道菜…"
        />
      </div>

      {/* 份量 */}
      <div>
        <SectionTitle>份量</SectionTitle>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            className="h-11 w-11 !px-0 text-lg"
            onClick={() => set('servings', Math.max(1, draft.servings - 1))}
          >
            −
          </Button>
          <div className="flex h-11 w-16 items-center justify-center rounded-xl border border-gray-300 bg-white text-lg font-bold dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
            {draft.servings}
          </div>
          <Button
            type="button"
            variant="secondary"
            className="h-11 w-11 !px-0 text-lg"
            onClick={() => set('servings', draft.servings + 1)}
          >
            +
          </Button>
        </div>
      </div>

      {/* 食材 */}
      <div>
        <SectionTitle>食材</SectionTitle>
        <div className="flex flex-col gap-2">
          {draft.ingredients.map((ing, idx) => (
            <div key={ing.id} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-center text-sm text-gray-400">
                {idx + 1}
              </span>
              <TextInput
                value={ing.name}
                onChange={(e) => updateIngredient(ing.id, { name: e.target.value })}
                placeholder="名稱"
                className="min-w-0 flex-1"
              />
              <TextInput
                value={ing.amount === 0 ? '' : String(ing.amount)}
                onChange={(e) =>
                  updateIngredient(ing.id, { amount: parseFloat(e.target.value) || 0 })
                }
                placeholder="份量"
                inputMode="decimal"
                className="w-20 shrink-0"
              />
              <Select
                value={ing.unit}
                onChange={(e) => updateIngredient(ing.id, { unit: e.target.value })}
                className="w-20 shrink-0"
              >
                <option value="">—</option>
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                aria-label={`刪除食材 ${ing.name || idx + 1}`}
                className="h-9 w-9 shrink-0 rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                onClick={() => removeIngredient(ing.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          className="mt-2"
          onClick={() => set('ingredients', [...draft.ingredients, newIngredient()])}
        >
          + 新增食材
        </Button>
      </div>

      {/* 步驟 */}
      <div>
        <SectionTitle>步驟</SectionTitle>
        <div className="flex flex-col gap-2">
          {draft.steps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700 dark:bg-green-900/50 dark:text-green-300">
                {idx + 1}
              </span>
              <TextArea
                rows={1}
                value={step.description}
                onChange={(e) => updateStep(step.id, { description: e.target.value })}
                placeholder="例如：煮滾一鍋水…"
                className="min-w-0 flex-1"
              />
              <button
                type="button"
                aria-label={`刪除步驟 ${idx + 1}`}
                className="h-9 w-9 shrink-0 rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                onClick={() => removeStep(step.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          className="mt-2"
          onClick={() =>
            set('steps', [...draft.steps, newStep(draft.steps.length)])
          }
        >
          + 新增步驟
        </Button>
      </div>

      {/* 標籤 */}
      <div>
        <SectionTitle>標籤</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {draft.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1">
              <Tag>#{tag}</Tag>
              <button
                type="button"
                aria-label={`移除標籤 ${tag}`}
                className="text-gray-400 hover:text-red-600"
                onClick={() => set('tags', draft.tags.filter((t) => t !== tag))}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <TextInput
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
            }}
            placeholder="輸入標籤後按 Enter，例如 Italian"
            className="flex-1"
          />
          <Button type="button" variant="secondary" onClick={addTag}>
            新增
          </Button>
        </div>
      </div>

      {/* 備註 */}
      <div>
        <SectionTitle>備註</SectionTitle>
        <TextArea
          rows={3}
          value={draft.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="小撇步、替代食材、保存方式…"
        />
      </div>

      <Button type="submit" disabled={submitting} className="py-3 text-base">
        {submitting ? '儲存中…' : submitLabel}
      </Button>
    </form>
  )
}

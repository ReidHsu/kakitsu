import { Button } from './ui'

interface ServingSelectorProps {
  servings: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export function ServingSelector({
  servings,
  onChange,
  min = 1,
  max = 99,
}: ServingSelectorProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        className="h-11 w-11 !px-0 text-lg"
        aria-label="減少份量"
        disabled={servings <= min}
        onClick={() => onChange(Math.max(min, servings - 1))}
      >
        −
      </Button>
      <div className="flex h-11 min-w-[4.5rem] items-center justify-center rounded-xl border border-gray-300 bg-white px-3 text-lg font-bold tabular-nums dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
        {servings}
      </div>
      <Button
        type="button"
        variant="secondary"
        className="h-11 w-11 !px-0 text-lg"
        aria-label="增加份量"
        disabled={servings >= max}
        onClick={() => onChange(Math.min(max, servings + 1))}
      >
        +
      </Button>
    </div>
  )
}

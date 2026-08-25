import { useEffect, useState } from 'react'

const STORAGE_KEY = 'kakitsu-theme'

function getInitialDark(): boolean {
  if (typeof document === 'undefined') return false
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'dark') return true
  if (saved === 'light') return false
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function useTheme(): [boolean, () => void] {
  const [dark, setDark] = useState(getInitialDark)

  useEffect(() => {
    const root = document.documentElement
    if (dark) root.classList.add('dark')
    else root.classList.remove('dark')
    try {
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
    } catch {
      /* 私密瀏覽可能無法寫入 localStorage */
    }
  }, [dark])

  return [dark, () => setDark((d) => !d)]
}

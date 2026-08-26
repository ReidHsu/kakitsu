import { HashRouter, Link, NavLink, Route, Routes } from 'react-router-dom'
import { RecipeListPage } from './pages/RecipeListPage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { RecipeCreatePage } from './pages/RecipeCreatePage'
import { RecipeEditPage } from './pages/RecipeEditPage'
import { SettingsPage } from './pages/SettingsPage'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition ${
    isActive
      ? 'text-green-600 dark:text-green-400'
      : 'text-gray-400 dark:text-gray-500'
  }`

function BottomNav() {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
      <div className="mx-auto flex h-16 max-w-xl items-stretch">
        <NavLink to="/" end className={navClass}>
          <span className="text-xl leading-none">🍳</span>
          <span>食譜</span>
        </NavLink>
        <Link
          to="/recipe/new"
          className="flex flex-1 items-center justify-center"
          aria-label="新增食譜"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-600 text-2xl font-bold text-white shadow-lg shadow-green-600/30 transition hover:bg-green-700 active:scale-95">
            +
          </span>
        </Link>
        <NavLink to="/settings" className={navClass}>
          <span className="text-xl leading-none">⚙️</span>
          <span>設定</span>
        </NavLink>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-dvh bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <Routes>
          <Route path="/" element={<RecipeListPage />} />
          <Route path="/recipe/new" element={<RecipeCreatePage />} />
          <Route path="/recipe/:id" element={<RecipeDetailPage />} />
          <Route path="/recipe/:id/edit" element={<RecipeEditPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<RecipeListPage />} />
        </Routes>
        <BottomNav />
      </div>
    </HashRouter>
  )
}

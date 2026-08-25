import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, SectionTitle } from '../components/ui'
import * as importExportService from '../services/importExportService'

type ImportStatus = 'idle' | 'working' | 'done' | 'error'

export function SettingsPage() {
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle')
  const [importMessage, setImportMessage] = useState('')

  const handleExport = async () => {
    const { json, filename } = await importExportService.buildExport()
    importExportService.downloadJson(json, filename)
  }

  const handleImport = async (file: File | undefined) => {
    if (!file) return
    setImportStatus('working')
    try {
      const text = await file.text()
      const result = await importExportService.importRecipes(text)
      setImportMessage(
        `匯入完成：新增 ${result.imported} 筆，更新 ${result.updated} 筆，略過 ${result.skipped} 筆。`,
      )
      setImportStatus('done')
    } catch (e) {
      setImportMessage(e instanceof Error ? e.message : '匯入失敗')
      setImportStatus('error')
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-safe">
      <div className="flex items-center py-4">
        <Link to="/" className="mr-3 text-gray-600 dark:text-gray-300">
          ←
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* 備份 */}
        <section>
          <SectionTitle>備份 / 還原</SectionTitle>
          <Card className="divide-y divide-gray-100 dark:divide-gray-700">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">匯出食譜</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  下載所有食譜為 JSON 檔
                </p>
              </div>
              <Button variant="secondary" onClick={handleExport}>
                ⬇️ 匯出
              </Button>
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">匯入食譜</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  從 JSON 檔還原，相同 id 會覆寫
                </p>
              </div>
              <label className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
                ⬆️ 匯入
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  disabled={importStatus === 'working'}
                  onChange={(e) => handleImport(e.target.files?.[0])}
                />
              </label>
            </div>
          </Card>
          {importMessage ? (
            <p
              className={`mt-2 text-sm ${
                importStatus === 'error'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-700 dark:text-green-400'
              }`}
            >
              {importStatus === 'working' ? '匯入中…' : importMessage}
            </p>
          ) : null}
        </section>

        {/* 關於 */}
        <section>
          <SectionTitle>關於</SectionTitle>
          <Card className="p-4">
            <p className="font-semibold text-gray-800 dark:text-gray-100">
              🍳 Kakitsu 自己煮
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              本機優先的食譜紀錄 App。所有資料只存在你的裝置（IndexedDB），
              不會上傳到任何伺服器。請記得定期匯出備份。
            </p>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              v0.1.0
            </p>
          </Card>
        </section>
      </div>
    </div>
  )
}

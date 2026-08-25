# 🍳 Kakitsu 自己煮

一個 **純靜態、本機優先（local-first）** 的食譜紀錄與份量計算 PWA。
所有資料只存在裝置的 IndexedDB，不需要後端、不需要帳號、**$0 / 月**，
可加入 iPhone / iPad / Mac 的主畫面當成 App 使用。

- React + TypeScript + Vite
- Tailwind CSS
- IndexedDB（Dexie.js）
- PWA（vite-plugin-pwa，離線可用）
- 可部署到 GitHub Pages / Cloudflare Pages

## 功能

- 食譜 CRUD（名稱、描述、食材、步驟、標籤、備註、圖片）
- **份量自動計算**：切換份量時食材等比例縮放，且不寫回資料庫
- 搜尋（名稱 / 標籤 / 食材名）
- 最愛標記 ⭐
- **匯出 / 匯入 JSON** 備份與還原
- 圖片自動縮放 + 壓縮（WebP / JPEG）後存入 IndexedDB
- 深色模式、iPhone 安全區域、行動裝置優化
- 離線 PWA（Service Worker 預先快取所有資源）

## 開發

```bash
npm install
npm run dev        # 開發伺服器
npm test           # 單元測試
npm run build      # 產出 dist/
npm run preview    # 預覽 build 結果
```

## 在 iPhone 上使用

1. 用 Safari 開啟網站
2. 點「分享」
3. 「加入主畫面」
4. 從主畫面圖示開啟（standalone 模式）

不需要 Apple Developer Program 或 App Store。

## 資料備份

資料只存在本機瀏覽器。**請定期「設定 → 匯出食譜」** 下載 JSON，
換手機或清除瀏覽器資料時再用「匯入食譜」還原。

## 部署到 GitHub Pages

1. 把專案推到 GitHub（預設分支 `main`）
2. 開啟 Repository Settings → Pages → 把 Source 設為 **GitHub Actions**
3. `.github/workflows/deploy.yml` 會在每次 push 後自動：type-check → 測試 → build → 部署到 GitHub Pages

網站位置：`https://<username>.github.io/<repository>/`

## 專案結構

```
src/
├── components/   # RecipeCard / RecipeForm / ServingSelector …
├── pages/        # List / Detail / Create / Edit / Settings
├── db/           # Dexie database + repository
├── services/     # recipe / importExport / image 服務
├── types/        # Recipe / Ingredient / Step 型別
├── utils/        # ingredientCalculator（份量計算）
└── hooks/        # useTheme
```

## 授權

[MIT](./LICENSE) © 2026 ReidHsu

## 路線圖

見 `plan.md`。目前完成第一階段 MVP（Phase 1–9）與測試 / CI（Phase 10）。

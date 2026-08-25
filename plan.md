# Recipe App --- 純靜態 PWA + 本機資料庫開發計畫

## 0. 專案名稱

Kakitsu ("自己煮"台語)

## 1. 專案目標

建立一個自用的食譜紀錄與計算 PWA（Progressive Web App），可以直接在
iPhone、iPad、Mac / Desktop 瀏覽器使用，並可透過 iPhone
Safari「加入主畫面」後像一般 App 一樣使用。

第一階段不建立 Backend、不建立 API、不使用 PostgreSQL，也不需要維護 Web
Server。

### 核心架構

``` text
React + TypeScript
        │
        ├── UI
        ├── Recipe calculation
        ├── PWA
        │
        └── IndexedDB
              │
              └── Local recipe data

Static hosting
        │
        └── GitHub Pages / Cloudflare Pages
```

### 第一階段明確不包含

-   Backend Server
-   REST / GraphQL API
-   PostgreSQL / MySQL
-   User authentication
-   Cloud synchronization
-   AWS infrastructure
-   App Store 發布

------------------------------------------------------------------------

# 2. 技術選擇

## Frontend

-   React
-   TypeScript
-   Vite

原因：

-   開發速度快
-   TypeScript 適合管理 Recipe / Ingredient 等資料結構
-   Vite 很適合建立純靜態網站
-   後續若要轉成 Capacitor / 真正 iOS App 也容易延伸

## UI

建議：

-   Tailwind CSS

第一版保持簡單，不需要過度設計。

## Local Database

使用：

-   IndexedDB

建議搭配：

-   Dexie.js

原因：

原生 IndexedDB API 比較繁瑣，Dexie 可以提供較容易維護的 TypeScript API。

## PWA

使用：

-   vite-plugin-pwa

需要支援：

-   Web App Manifest
-   Service Worker
-   Offline cache
-   Add to Home Screen

## Hosting

第一階段可以使用：

-   GitHub Pages

或：

-   Cloudflare Pages

兩者都可以用來 hosting 純靜態檔案。

------------------------------------------------------------------------

# 3. MVP 功能

第一版先把最核心的「食譜紀錄」完成。

## 3.1 Recipe List

首頁顯示所有食譜。

``` text
My Recipes

[ Search recipes... ]

🍝 番茄義大利麵
🍛 雞肉咖哩
🥩 香煎牛排

              [+ New Recipe]
```

功能：

-   查看所有食譜
-   搜尋食譜
-   點擊進入食譜詳細頁
-   新增食譜

------------------------------------------------------------------------

# 4. Recipe Data Model

Recipe 建議資料結構：

``` ts
interface Recipe {
  id: string
  name: string
  description?: string
  servings: number
  ingredients: Ingredient[]
  steps: RecipeStep[]
  tags: string[]
  image?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
```

Ingredient：

``` ts
interface Ingredient {
  id: string
  name: string
  amount: number
  unit: string
}
```

Step：

``` ts
interface RecipeStep {
  id: string
  order: number
  description: string
}
```

------------------------------------------------------------------------

# 5. 新增食譜

建立 Recipe Editor。

``` text
New Recipe

Name
[____________________]

Servings
[-] 2 [+]

Ingredients

[ 義大利麵 ] [ 200 ] [ g ]
[ 番茄     ] [ 300 ] [ g ]
[ 橄欖油   ] [  20 ] [ ml ]
[ 大蒜     ] [   3 ] [ 瓣 ]

[ + Add Ingredient ]

Steps

1. [________________________]
2. [________________________]

[ + Add Step ]

[ Save ]
```

需要支援：

-   新增食材
-   刪除食材
-   修改食材
-   新增步驟
-   刪除步驟
-   修改步驟
-   設定 servings
-   設定 tags
-   新增備註

------------------------------------------------------------------------

# 6. Recipe Detail

食譜詳細頁：

``` text
番茄義大利麵

Servings
[-] 2 [+]

Ingredients
----------------
200 g   義大利麵
300 g   番茄
20 ml   橄欖油
3 瓣    大蒜

Steps
----------------
1. 煮義大利麵
2. 炒香大蒜
3. 加入番茄
4. 混合義大利麵

[ Edit ]
[ Delete ]
```

------------------------------------------------------------------------

# 7. 食材份量自動計算

這是第一版的重要功能。

假設原始食譜：

``` text
2 servings

義大利麵 200 g
番茄     300 g
橄欖油    20 ml
大蒜       3 瓣
```

切換到 4 servings：

``` text
4 servings

義大利麵 400 g
番茄     600 g
橄欖油    40 ml
大蒜       6 瓣
```

計算公式：

``` text
newAmount = originalAmount * newServings / originalServings
```

注意：

資料庫只保存原始 amount，不要把計算後的數字寫回資料庫。

------------------------------------------------------------------------

# 8. IndexedDB 設計

使用 Dexie。

概念：

``` text
IndexedDB
│
└── recipes
      ├── recipe-001
      ├── recipe-002
      └── recipe-003
```

建立：

``` ts
class RecipeDatabase extends Dexie {
  recipes!: Table<Recipe, string>

  constructor() {
    super("RecipeDatabase")

    this.version(1).stores({
      recipes: "id, name, createdAt, updatedAt"
    })
  }
}
```

需要建立：

-   database.ts
-   recipe repository / service
-   CRUD functions

例如：

``` ts
createRecipe()
getRecipe()
getRecipes()
updateRecipe()
deleteRecipe()
searchRecipes()
```

UI 不直接操作 IndexedDB。

建議：

``` text
React Component
       ↓
Recipe Service
       ↓
Dexie
       ↓
IndexedDB
```

------------------------------------------------------------------------

# 9. 搜尋功能

第一版先做簡單搜尋。

搜尋：

``` text
chicken
```

可以找到：

``` text
Chicken Curry
Chicken Salad
Grilled Chicken
```

可以搜尋：

-   Recipe name
-   Tags
-   Ingredient name

第一版不需要全文搜尋引擎。

------------------------------------------------------------------------

# 10. PWA

加入 PWA 支援。

需要：

## Manifest

設定：

-   name
-   short_name
-   description
-   icons
-   start_url
-   display: standalone
-   theme_color

## Service Worker

需要 cache：

-   HTML
-   JS
-   CSS
-   icons
-   application assets

目標：

即使沒有 Internet，也可以：

``` text
Open App
   ↓
PWA
   ↓
IndexedDB
   ↓
查看 / 新增 / 修改食譜
```

------------------------------------------------------------------------

# 11. iPhone 使用方式

完成 PWA 後：

1.  使用 Safari 開啟網站
2.  點擊 Share
3.  選擇「加入主畫面」
4.  使用 Home Screen Icon 開啟

結果：

``` text
iPhone Home Screen
       ↓
Recipe App
       ↓
Standalone PWA
```

第一階段不需要：

-   Apple Developer Program
-   App Store
-   Xcode

------------------------------------------------------------------------

# 12. Backup / Restore

因為資料存在 iPhone 本機，所以一定要加入資料備份功能。

## Export

把 IndexedDB 中所有 recipes 匯出成 JSON：

``` text
recipes.json
```

例如：

``` json
{
  "version": 1,
  "exportedAt": "2026-08-25T10:00:00Z",
  "recipes": []
}
```

## Import

可以從 JSON 匯入食譜。

流程：

``` text
Settings
   │
   ├── Export Recipes
   │       ↓
   │    recipes.json
   │
   └── Import Recipes
           ↓
       Validate JSON
           ↓
       IndexedDB
```

Import 時需要：

-   驗證 JSON schema
-   檢查 version
-   避免 invalid recipe
-   處理 duplicate ID

------------------------------------------------------------------------

# 13. 圖片處理

第一版可以先支援 Recipe image。

但是不要直接把大型原始圖片無限制塞進 IndexedDB。

建議：

``` text
Photo
 ↓
Resize
 ↓
Compress
 ↓
Blob / Base64
 ↓
IndexedDB
```

第一版可以限制：

-   最大圖片尺寸
-   JPEG / WebP
-   壓縮品質

如果之後照片需求變大，再重新設計圖片 storage。

------------------------------------------------------------------------

# 14. UI Page Structure

建議：

``` text
/
├── Recipe List
│
├── /recipe/:id
│   └── Recipe Detail
│
├── /recipe/new
│   └── Recipe Editor
│
├── /recipe/:id/edit
│   └── Recipe Editor
│
└── /settings
    ├── Export
    ├── Import
    └── About
```

------------------------------------------------------------------------

# 15. Component Structure

建議：

``` text
src/
├── components/
│   ├── RecipeCard.tsx
│   ├── RecipeList.tsx
│   ├── RecipeForm.tsx
│   ├── IngredientEditor.tsx
│   ├── IngredientList.tsx
│   ├── ServingSelector.tsx
│   └── StepEditor.tsx
│
├── pages/
│   ├── RecipeListPage.tsx
│   ├── RecipeDetailPage.tsx
│   ├── RecipeCreatePage.tsx
│   ├── RecipeEditPage.tsx
│   └── SettingsPage.tsx
│
├── db/
│   ├── database.ts
│   └── recipeRepository.ts
│
├── services/
│   ├── recipeService.ts
│   ├── importExportService.ts
│   └── imageService.ts
│
├── types/
│   └── recipe.ts
│
├── utils/
│   └── ingredientCalculator.ts
│
└── App.tsx
```

------------------------------------------------------------------------

# 16. 開發階段

## Phase 1 --- Project Setup

建立：

``` text
React
TypeScript
Vite
Tailwind CSS
```

完成：

-   npm install
-   development server
-   production build
-   basic routing

驗證：

``` bash
npm run dev
npm run build
```

------------------------------------------------------------------------

# Phase 2 --- Database

加入：

``` text
Dexie
IndexedDB
```

完成：

-   Recipe schema
-   CRUD
-   repository/service layer

驗證：

-   建立 Recipe
-   讀取 Recipe
-   修改 Recipe
-   刪除 Recipe
-   關閉 Browser 後重新開啟，資料仍存在

------------------------------------------------------------------------

# Phase 3 --- Recipe UI

完成：

-   Recipe List
-   Recipe Detail
-   Create Recipe
-   Edit Recipe
-   Delete Recipe

------------------------------------------------------------------------

# Phase 4 --- Ingredient Calculation

完成：

-   Serving selector
-   Automatic ingredient calculation
-   Amount rounding

例如：

``` text
2 → 3 servings

100 g → 150 g
1.5 tbsp → 2.25 tbsp
```

需要決定 rounding policy。

建議：

-   小於 10：保留 1 位小數
-   10 以上：最多保留整數或 1 位小數
-   不要過度四捨五入

------------------------------------------------------------------------

# Phase 5 --- Search / Tags

加入：

-   Search
-   Tags
-   Favorites

例如：

``` text
#Italian
#Dinner
#Quick
#Chicken
```

------------------------------------------------------------------------

# Phase 6 --- PWA

加入：

-   manifest
-   icons
-   service worker
-   offline support
-   installable PWA

測試：

``` text
Online
 ↓
Open App
 ↓
Disconnect Network
 ↓
Open App
 ↓
仍可使用
```

------------------------------------------------------------------------

# Phase 7 --- Backup / Restore

完成：

-   Export JSON
-   Import JSON
-   Validation
-   Version migration

------------------------------------------------------------------------

# Phase 8 --- Image

加入：

-   Recipe image
-   Image resize
-   Compression
-   IndexedDB storage

------------------------------------------------------------------------

# Phase 9 --- Mobile UX

針對 iPhone 優化：

-   Touch target
-   Safe area
-   Bottom navigation
-   Responsive layout
-   Dark mode
-   Keyboard handling
-   iOS Safari testing

特別注意：

``` css
padding-bottom: env(safe-area-inset-bottom);
```

避免 iPhone Home Indicator 遮住 UI。

------------------------------------------------------------------------

# 17. Testing

至少測試：

## Recipe CRUD

-   [ ] Create
-   [ ] Read
-   [ ] Update
-   [ ] Delete

## Calculation

-   [ ] 1 → 2 servings
-   [ ] 2 → 4 servings
-   [ ] 4 → 1 serving
-   [ ] 小數量
-   [ ] 小數 amount

## Persistence

-   [ ] Reload page
-   [ ] Close browser
-   [ ] Reopen PWA
-   [ ] Data still exists

## Import / Export

-   [ ] Export
-   [ ] Import
-   [ ] Invalid JSON
-   [ ] Duplicate ID
-   [ ] Older schema version

## PWA

-   [ ] Install
-   [ ] Offline
-   [ ] Launch from Home Screen
-   [ ] Icon
-   [ ] Standalone mode

## Mobile

-   [ ] iPhone Safari
-   [ ] iPhone PWA
-   [ ] Portrait
-   [ ] Landscape

------------------------------------------------------------------------

# 18. Deployment

第一階段使用 GitHub Pages。

流程：

``` text
git push
    ↓
GitHub Actions
    ↓
npm ci
    ↓
npm run build
    ↓
Deploy dist/
    ↓
GitHub Pages
```

網站：

``` text
https://<username>.github.io/<repository>/
```

不需要：

``` text
EC2
Docker
Nginx
Load Balancer
Database
Backend
```

------------------------------------------------------------------------

# 19. CI/CD

建立 GitHub Actions：

``` text
.github/
└── workflows/
    └── deploy.yml
```

Pipeline：

``` text
Push main
   ↓
Install dependencies
   ↓
TypeScript check
   ↓
Unit tests
   ↓
npm run build
   ↓
Deploy GitHub Pages
```

如果 build / test 失敗，不 deploy。

------------------------------------------------------------------------

# 20. 未來功能 --- Phase 2

等 MVP 穩定後再考慮。

## Shopping List

選擇多個 recipes：

``` text
Recipe A × 2
Recipe B × 1
Recipe C × 2
```

自動合併食材：

``` text
Shopping List

Tomato       800 g
Eggs          12
Chicken       1 kg
Onion          3
Garlic         2
```

## Cost Calculation

加入：

``` text
Ingredient
├── amount
├── unit
├── price
└── priceUnit
```

計算：

``` text
Recipe Cost
Cost / Serving
```

## Nutrition

加入：

``` text
Calories
Protein
Carbohydrate
Fat
```

## Advanced Search

例如：

``` text
has:chicken
tag:dinner
under:30min
favorite:true
```

------------------------------------------------------------------------

# 21. 未來多裝置同步

目前：

``` text
iPhone
   ↓
IndexedDB
```

如果之後需要：

``` text
iPhone
iPad
Mac
   ↓
同一份資料
```

再加入 Cloud Backend。

候選：

-   Supabase
-   Firebase
-   自建 API

架構變成：

``` text
                  ┌── iPhone
                  │
React PWA ────────┼── iPad
                  │
                  └── Mac
                       │
                       ↓
                 Cloud Backend
                       │
                       ↓
                    Database
```

不要在 MVP 階段就加入這些東西。

------------------------------------------------------------------------

# 22. 真正 iOS App 的未來路線

如果 PWA 已經很好用，但之後希望變成真正的 iOS App，可以使用：

``` text
Existing React App
        ↓
    Capacitor
        ↓
   iOS Project
        ↓
      Xcode
        ↓
     iPhone App
```

這樣可以最大程度重用原本的 React UI 和 business logic。

只有在需要以下能力時才建議考慮：

-   App Store
-   Native iOS APIs
-   Background tasks
-   Push notifications
-   更深的 Photos / Files 整合
-   Native performance

------------------------------------------------------------------------

# 23. 成本

MVP：

``` text
React              $0
TypeScript         $0
Vite               $0
Dexie              $0
PWA                $0
GitHub             $0
GitHub Pages       $0
IndexedDB          $0
Apple Developer    $0  ← PWA 不需要
Backend            $0
Database           $0
```

因此第一版可以做到：

> **\$0 / month**

如果未來要發布 App Store，才需要考慮 Apple Developer Program 年費。

------------------------------------------------------------------------

# 24. 建議的 MVP Scope

不要一次做太多。

第一個可用版本只做：

``` text
┌──────────────────────────────┐
│       My Recipe              │
├──────────────────────────────┤
│                              │
│ 🔍 Search                    │
│                              │
│ 🍝 Tomato Pasta              │
│ 🍛 Chicken Curry             │
│ 🥩 Steak                     │
│                              │
│                        [+]   │
└──────────────────────────────┘
```

Recipe：

``` text
Recipe
 ├── Name
 ├── Image
 ├── Servings
 ├── Ingredients
 ├── Steps
 ├── Tags
 └── Notes
```

必要功能只有：

``` text
CRUD
+
Serving Calculation
+
Search
+
IndexedDB
+
PWA
+
Export / Import
```

完成這些後，就已經是一個可以每天使用的食譜 App。

------------------------------------------------------------------------

# 25. 最終目標

第一階段完成後，使用者體驗應該是：

``` text
iPhone Home Screen
        ↓
   🍳 My Recipe
        ↓
    Recipe List
        ↓
   Select Recipe
        ↓
  Adjust Servings
        ↓
 Automatically calculate
      ingredients
        ↓
      Cook
```

所有資料：

``` text
             Internet
                │
                X
                │
             不需要
                │
                ↓
          ┌───────────┐
          │  iPhone   │
          │           │
          │   PWA     │
          │     ↓     │
          │ IndexedDB │
          └───────────┘
```

核心原則：

> **先做一個完全不需要 Backend 的 Local-first Recipe PWA。**
>
> 等真的遇到「多裝置同步」或「雲端備份」需求，再加入 Backend。

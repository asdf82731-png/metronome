# Pro Metronome（PWA）

可安裝到手機主畫面、離線使用的節拍器。

## 用 GitHub Pages 上線（免費）

1. 在 GitHub 建立一個新的 repository，例如 `metronome`（設為 Public）。
2. 按「Add file → Upload files」，把這個資料夾裡的**所有檔案與 icons 資料夾**拖進去，按「Commit changes」。
3. 到 repository 的「Settings → Pages」，Source 選「Deploy from a branch」，Branch 選 `main`、資料夾 `/ (root)`，按 Save。
4. 約 1 分鐘後，網址會是 `https://<你的帳號>.github.io/metronome/`。

## 安裝到手機

- **iPhone（Safari）**：開啟網址 → 分享按鈕 → 「加入主畫面」。
- **Android（Chrome）**：開啟網址 → 右上選單 → 「安裝應用程式」或「加到主畫面」。

第一次開啟後就會快取，之後沒有網路也能使用。

## 程式架構（Astryx 版）

介面用 [Astryx](https://github.com/meta/astryx)（Meta 開源的設計系統）＋ React 19 製作，用 Vite 建置。

- `src/`：原始碼。改程式只改這裡。
  - `App.jsx`：畫面（Astryx 元件）
  - `engine.js`：Web Audio 節拍器（排程、合成音色、人聲數拍）
  - `music.js`：拍號、細分節奏、音色等資料
  - `vox.js`：人聲數拍的音檔（base64）
  - `styles.css`：版面、擺錘、拍子條等節拍器專用的樣式（顏色用 Astryx 主題 token）
  - `public/`：`sw.js`、`manifest.webmanifest`、`icons/`，建置時原樣複製到根目錄
- 根目錄的 `index.html`、`assets/`、`sw.js`、`manifest.webmanifest`、`icons/` 是**建置產生的檔案**，GitHub Pages 直接提供它們。不要手動修改。

## 更新版本

```bash
npm install        # 第一次
npm run build      # 改完 src/ 之後重新建置，產生根目錄的檔案
```

1. 把 `src/public/sw.js` 第 2 行的版本（例如 `pro-metronome-v16`）加一。
2. `npm run build`，把 `src/` 和建置產生的檔案一起 commit。
3. 手機重新開啟 App 一兩次就會拿到新版。

### 自動檢查
建置完、commit 之前跑一次：

```bash
npx playwright install chromium   # 第一次
npm run check
```

在手機直向、手機橫向、平板直向、平板橫向（TCL NXTPAPER 11）各開一次，檢查：打開沒有錯誤、開始鍵完整出現在畫面上（不用捲動）、BPM 輸入 300 時三位數沒有被截斷、頁面不會左右捲動。沒通過的會列出原因。

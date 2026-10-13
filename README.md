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

## 更新版本

改完檔案重新上傳後，把 `sw.js` 第 2 行的 `pro-metronome-v1` 改成 `v2`（依序遞增），手機重新開啟 App 一兩次就會拿到新版。

# Pro Metronome（已搬家）

這個 App 已經搬到 [`asdf82731-png/linear-grooves-app`](https://github.com/asdf82731-png/linear-grooves-app) 的 `metronome/` 資料夾，和其他鼓手練習 App 共用音訊與計時器的程式碼。

- 新網址：`https://asdf82731-png.github.io/linear-grooves-app/metronome/`
- 之後的修改都在那個 repo 進行，這裡不再更新。

這個 repo 只留下兩個檔案，讓舊網址繼續有用：

- `index.html`：把舊網址 `https://asdf82731-png.github.io/metronome/` 轉到新網址。
- `sw.js`：移除舊 App 的 service worker 和它的快取（`pro-metronome-v26` 以前的版本；新 App 的快取不會動）。

已經安裝在手機主畫面的舊 App 要從新網址重新安裝一次。設定存在同一個網域，會留著。

搬家前的完整原始碼都在這個 repo 的 git 歷史裡（最後一版是 commit `63de087`）。

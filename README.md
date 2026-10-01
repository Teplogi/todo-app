# ToDo リスト

Next.js で作成したシンプルな ToDo リスト Web アプリです。

## 機能

- タスクの **追加**（Enter キーでも追加可）
- **完了マーク**（チェックボックスで切替、完了率をプログレスバーで表示）
- **削除**（削除後 5 秒間は「元に戻す」が可能）
- 完了済みタスクの一括削除
- 「すべて / 未完了 / 完了」での絞り込み
- タスク名のダブルクリック編集（Enter で確定、Esc でキャンセル）
- **データ永続化**：`localStorage` に保存するため、ブラウザを閉じても残ります（別タブの変更も同期）
- ダークモード・スマホ表示に対応、スクリーンリーダー向けラベル付き

## 技術スタック

- Next.js (App Router) / React / TypeScript
- Tailwind CSS
- Vercel でホスティング

## ローカルでの起動

```bash
npm install
npm run dev
```

http://localhost:3000 を開いてください。

## 構成

| ファイル | 役割 |
| --- | --- |
| `src/lib/todoStore.ts` | localStorage と同期するストア（`useSyncExternalStore` 用） |
| `src/app/TodoApp.tsx` | 画面本体（クライアントコンポーネント） |
| `src/app/page.tsx` | トップページ |

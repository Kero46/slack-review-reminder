# algo-review — Slack 忘却曲線リマインド

解いた問題を、解けるようになった日を起点に **1日後・3日後・7日後・30日後** に復習する仕組みを、
Slack だけで完結させるアプリです（Slack の次世代プラットフォーム / Deno 製）。

- 初見で解けた問題 → 記録のみ（復習対象にしない）
- 初見で解けなかった問題 → 解けた日を起点に 1/3/7/30 日後を自動計算して復習
- 毎朝 9 時に「今日やる問題」をボタン付きで通知。ボタンで結果を登録すると次段階へ自動で進む

列ID・選択肢IDの手作業は不要です。`setup` がリストを API 生成し、列IDを自動取得して保存します。

## 必要なもの
- Slack 有料プラン（カスタム関数・Lists API・datastore は有料機能）
- 対象ワークスペースでカスタムアプリのインストールが許可されていること
- [Deno](https://deno.land/) と [Slack CLI](https://tools.slack.dev/slack-cli/)

## デプロイ手順（各自で実行）
```bash
git clone <this repo>
cd algo-review
slack login                 # 自分のワークスペースを認証
slack deploy                # アプリをデプロイ（初回は slack init が必要な場合あり）

# トリガーを作成（deployed 版を選ぶ）
slack trigger create --trigger-def triggers/setup.ts
slack trigger create --trigger-def triggers/add_problem.ts
slack trigger create --trigger-def triggers/daily.ts        # start_time は未来日時に
slack trigger create --trigger-def triggers/test_daily.ts   # 手動テスト用（任意）
```

## 使い方
1. 「復習システムを初期化」リンクを実行 → フォームで通知先チャンネルを選ぶ
   - リストが生成され、そのチャンネルに共有され、bot もチャンネルに参加します
2. 「問題を登録」リンクで問題を追加（problem number / url / 初見結果 / 登録日）
3. 毎朝 9 時に「今日やる問題」がボタン付きで通知される
4. 「✅ 解けた / ❌ 解けなかった」を押すと次段階へ自動で進む（後から押しても有効）

## 注意
- `triggers/daily.ts` の `start_time` が過去だと作成時に弾かれます。未来日時にしてください。
- スケジュール実行は **deployed 版** で動きます（`slack run` はローカル起動中のみ）。
- 状態遷移ロジックは `lib/transition.ts`、列定義は `lib/listdef.ts` にあります。

## ライセンス
MIT

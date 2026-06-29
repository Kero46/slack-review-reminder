import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerTypes } from "deno-slack-api/mod.ts";
import { ReviewDailyWorkflow } from "../workflows/review_daily_wf.ts";

// 実行時点から見て「次に迎える 09:00 (JST)」を ISO 文字列で返す。
// 既に今日の9時を過ぎていれば翌日の9時、まだなら今日の9時。
function nextNineAMJST(): string {
  const JST = 9 * 60; // 分
  const now = new Date();
  // 現在の JST 時刻
  const jstNow = new Date(now.getTime() + JST * 60_000);
  const y = jstNow.getUTCFullYear();
  const m = jstNow.getUTCMonth();
  const d = jstNow.getUTCDate();
  // 今日の 09:00 JST を UTC ミリ秒で作る（JST 09:00 = UTC 00:00）
  let target = Date.UTC(y, m, d, 0, 0, 0);
  // 既に過ぎていれば翌日へ
  if (now.getTime() >= target) target += 24 * 3600_000;
  // +09:00 表記の ISO 文字列を組み立てる
  const t = new Date(target + JST * 60_000); // JST の壁時計
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}T09:00:00+09:00`;
}

const trigger: Trigger<typeof ReviewDailyWorkflow.definition> = {
  type: TriggerTypes.Scheduled,
  name: "毎朝の復習通知",
  workflow: "#/workflows/review_daily_wf",
  inputs: {},
  schedule: {
    start_time: nextNineAMJST(),
    timezone: "Asia/Tokyo",
    frequency: { type: "daily" },
  },
};
export default trigger;
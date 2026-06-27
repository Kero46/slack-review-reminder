import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerTypes } from "deno-slack-api/mod.ts";
import { ReviewDailyWorkflow } from "../workflows/review_daily_wf.ts";

// テスト用: リンクを押すと review_daily_wf をその場で1回実行する。
// 動作確認が済んだら削除してよい。
const trigger: Trigger<typeof ReviewDailyWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "復習通知を今すぐ実行（テスト）",
  description: "review_daily を手動で起動",
  workflow: "#/workflows/review_daily_wf",
  inputs: {},
};
export default trigger;

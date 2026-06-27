import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerTypes } from "deno-slack-api/mod.ts";
import { ReviewDailyWorkflow } from "../workflows/review_daily_wf.ts";

// 毎朝 09:00 (JST) に通知。start_time は未来日時にすること。
const trigger: Trigger<typeof ReviewDailyWorkflow.definition> = {
  type: TriggerTypes.Scheduled,
  name: "毎朝の復習通知",
  workflow: "#/workflows/review_daily_wf",
  inputs: {},
  schedule: {
    start_time: "2026-06-28T09:00:00+09:00",
    timezone: "Asia/Tokyo",
    frequency: { type: "daily" },
  },
};
export default trigger;

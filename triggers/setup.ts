import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import { SetupWorkflow } from "../workflows/setup_wf.ts";

// セットアップ用リンク。フォームで通知先チャンネルを選ぶので押す場所に依存しない。
const trigger: Trigger<typeof SetupWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "復習システムを初期化",
  description: "復習リストを生成して初期設定する",
  workflow: "#/workflows/setup_wf",
  inputs: { interactivity: { value: TriggerContextData.Shortcut.interactivity } },
};
export default trigger;
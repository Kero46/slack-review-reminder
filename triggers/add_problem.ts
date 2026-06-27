import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import { AddProblemWorkflow } from "../workflows/add_problem_wf.ts";

// 問題登録フォームを開くリンク。
const trigger: Trigger<typeof AddProblemWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "問題を登録",
  description: "問題登録フォームを開く",
  workflow: "#/workflows/add_problem_wf",
  inputs: { interactivity: { value: TriggerContextData.Shortcut.interactivity } },
};
export default trigger;

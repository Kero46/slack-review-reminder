import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { SetupFunction } from "../functions/setup.ts";

export const SetupWorkflow = DefineWorkflow({
  callback_id: "setup_wf",
  title: "Setup",
  description: "復習リストを生成して初期化する",
  input_parameters: {
    properties: { interactivity: { type: Schema.slack.types.interactivity } },
    required: ["interactivity"],
  },
});

// フォームで通知先チャンネルを選ばせる（押す場所に依存しない）
const form = SetupWorkflow.addStep(Schema.slack.functions.OpenForm, {
  title: "復習システムの初期化",
  interactivity: SetupWorkflow.inputs.interactivity,
  submit_label: "初期化する",
  fields: {
    required: ["channel"],
    elements: [
      { name: "channel", title: "通知先チャンネル", type: Schema.slack.types.channel_id },
    ],
  },
});

SetupWorkflow.addStep(SetupFunction, { channel: form.outputs.fields.channel });
export default SetupWorkflow;
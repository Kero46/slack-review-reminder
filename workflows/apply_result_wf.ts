import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { ApplyResultFunction } from "../functions/apply_result.ts";

export const ApplyResultWorkflow = DefineWorkflow({
  callback_id: "apply_result_wf",
  title: "Apply result",
  description: "復習結果を反映する",
  input_parameters: {
    properties: {
      item_id: { type: Schema.types.string },
      result: { type: Schema.types.string },
    },
    required: ["item_id", "result"],
  },
});
ApplyResultWorkflow.addStep(ApplyResultFunction, {
  item_id: ApplyResultWorkflow.inputs.item_id,
  result: ApplyResultWorkflow.inputs.result,
});
export default ApplyResultWorkflow;

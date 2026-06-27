import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { AddProblemFunction } from "../functions/add_problem.ts";

export const AddProblemWorkflow = DefineWorkflow({
  callback_id: "add_problem_wf",
  title: "Add problem",
  description: "問題を登録する",
  input_parameters: {
    properties: { interactivity: { type: Schema.slack.types.interactivity } },
    required: ["interactivity"],
  },
});
const form = AddProblemWorkflow.addStep(Schema.slack.functions.OpenForm, {
  title: "問題登録",
  interactivity: AddProblemWorkflow.inputs.interactivity,
  submit_label: "登録",
  fields: {
    required: ["problem_number", "url", "first_result", "base_date"],
    elements: [
      { name: "problem_number", title: "problem number", type: Schema.types.string },
      { name: "url", title: "url", type: Schema.types.string },
      {
        name: "first_result", title: "初見結果", type: Schema.types.string,
        enum: ["solved", "not solved"],
        choices: [
          { value: "solved", title: "solved" },
          { value: "not solved", title: "not solved" },
        ],
      },
      { name: "base_date", title: "登録日", type: Schema.slack.types.date },
    ],
  },
});
AddProblemWorkflow.addStep(AddProblemFunction, {
  problem_number: form.outputs.fields.problem_number,
  url: form.outputs.fields.url,
  first_result: form.outputs.fields.first_result,
  base_date: form.outputs.fields.base_date,
});
export default AddProblemWorkflow;

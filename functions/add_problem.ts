import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { FIRST, KEY, STAGE, STATUS } from "../lib/listdef.ts";
import { loadConfig } from "../lib/config_store.ts";

/**
 * add_problem（問題登録フォームから1問追加）
 * 入力: problem_number, url, first_result(solved/not solved), base_date
 * 初見solved → 記録のみ（status=completed, current stage=completed）
 * 初見not solved → 復習対象（status=active, current stage=not solved, due=base_date）
 */
export const AddProblemFunction = DefineFunction({
  callback_id: "add_problem",
  title: "Add problem",
  description: "問題を1件登録する",
  source_file: "functions/add_problem.ts",
  input_parameters: {
    properties: {
      problem_number: { type: Schema.types.string },
      url: { type: Schema.types.string },
      first_result: { type: Schema.types.string, description: "solved / not solved" },
      base_date: { type: Schema.slack.types.date },
    },
    required: ["problem_number", "url", "first_result", "base_date"],
  },
  output_parameters: { properties: {}, required: [] },
});

export default SlackFunction(AddProblemFunction, async ({ inputs, client }) => {
  const cfg = await loadConfig(client);
  const solvedFirst = (inputs.first_result ?? "").trim() === "solved";
  const base = inputs.base_date;
  const C = cfg.cols;

  // 主キー(text)は rich_text で書く必要がある
  const richText = (s: string) => [{
    type: "rich_text",
    elements: [{ type: "rich_text_section", elements: [{ type: "text", text: s }] }],
  }];

  // deno-lint-ignore no-explicit-any
  const initial_fields: any[] = [
    { column_id: C[KEY.problem_number], rich_text: richText(inputs.problem_number) },
    { column_id: C[KEY.url], link: [{ original_url: inputs.url, display_as_url: true }] },
    { column_id: C[KEY.first_result], select: [solvedFirst ? FIRST.solved : FIRST.not_solved] },
  ];
  if (solvedFirst) {
    initial_fields.push({ column_id: C[KEY.current_stage], select: [STAGE.completed] });
    initial_fields.push({ column_id: C[KEY.status], select: [STATUS.completed] });
    initial_fields.push({ column_id: C[KEY.solved], date: [base] });
  } else {
    initial_fields.push({ column_id: C[KEY.current_stage], select: [STAGE.not_solved] });
    initial_fields.push({ column_id: C[KEY.status], select: [STATUS.active] });
    initial_fields.push({ column_id: C[KEY.not_solved], date: [base] });
    initial_fields.push({ column_id: C[KEY.due_date], date: [base] });
  }

  const res = await client.apiCall("slackLists.items.create", {
    list_id: cfg.list_id,
    initial_fields,
  });
  if (!res.ok) {
    return { error: `items.create failed: ${res.error}` };
  }
  return { outputs: {} };
});

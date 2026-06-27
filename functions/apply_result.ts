import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { loadConfig } from "../lib/config_store.ts";
import { buildCells, Item, readDate, readSelectValue } from "../lib/list_io.ts";
import { computeTransition, todayISO } from "../lib/transition.ts";
import { KEY, STAGE_BY_VALUE, TZ_OFFSET_HOURS } from "../lib/listdef.ts";

/**
 * apply_result（workflow_button のリンクトリガーから起動）
 * 入力: item_id, result(solved/not solved)
 * 現在の current stage / solved を List から読み、遷移を計算して List を更新。
 * 待ち受けないので「後からボタンを押しても効く」。
 */
export const ApplyResultFunction = DefineFunction({
  callback_id: "apply_result",
  title: "Apply review result",
  description: "復習結果を反映して次段階・復習日を更新する",
  source_file: "functions/apply_result.ts",
  input_parameters: {
    properties: {
      item_id: { type: Schema.types.string },
      result: { type: Schema.types.string, description: "solved / not solved" },
    },
    required: ["item_id", "result"],
  },
  output_parameters: {
    properties: { next_stage: { type: Schema.types.string } },
    required: [],
  },
});

export default SlackFunction(ApplyResultFunction, async ({ inputs, client }) => {
  const cfg = await loadConfig(client);
  const list = await client.apiCall("slackLists.items.list", { list_id: cfg.list_id, limit: 200 });
  if (!list.ok) return { error: `items.list failed: ${list.error}` };

  const item = ((list.items ?? []) as Item[]).find((it) => it.id === inputs.item_id);
  if (!item) return { error: "item not found" };

  const stageValue = readSelectValue(item, cfg, KEY.current_stage);
  const stage = STAGE_BY_VALUE[stageValue] ?? "not solved";
  const solved = readDate(item, cfg, KEY.solved);
  const today = todayISO(TZ_OFFSET_HOURS);

  const s = computeTransition(stage, (inputs.result ?? "").trim(), solved, today);
  const upd = await client.apiCall("slackLists.items.update", {
    list_id: cfg.list_id,
    cells: buildCells(inputs.item_id, cfg, s),
  });
  if (!upd.ok) return { error: `items.update failed: ${upd.error}` };

  // 確認メッセージ
  await client.chat.postMessage({
    channel: cfg.channel_id,
    text: `登録: ${inputs.result} → 次は *${s.current_stage}*${s.due_date ? `（期日 ${s.due_date}）` : ""}`,
  });
  return { outputs: { next_stage: s.current_stage } };
});

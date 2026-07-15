import { DefineFunction, SlackFunction } from "deno-slack-sdk/mod.ts";
import { loadConfig } from "../lib/config_store.ts";
import { Item, readDate, readSelectValue, readText, readUrl } from "../lib/list_io.ts";
import { STAGE_BY_VALUE, STATUS, KEY, TZ_OFFSET_HOURS } from "../lib/listdef.ts";
import { todayISO } from "../lib/transition.ts";

/**
 * review_daily（毎朝起動）
 * due date = today かつ status = active を抽出し、各問題を workflow_button 付きで投稿。
 * ボタンは apply_result のリンクトリガーを起動する（待ち受け不要 → 後から押しても効く）。
 */
export const ReviewDailyFunction = DefineFunction({
  callback_id: "review_daily",
  title: "Post due reviews",
  description: "今日やる復習問題をボタン付きで通知する",
  source_file: "functions/review_daily.ts",
  input_parameters: { properties: {}, required: [] },
  output_parameters: { properties: {}, required: [] },
});

export default SlackFunction(ReviewDailyFunction, async ({ client }) => {
  const cfg = await loadConfig(client);
  const today = todayISO(TZ_OFFSET_HOURS);

  const list = await client.apiCall("slackLists.items.list", { list_id: cfg.list_id, limit: 200 });
  if (!list.ok) {
    await client.chat.postMessage({ channel: cfg.channel_id, text: `通知失敗: ${list.error}` });
    return { completed: true, outputs: {} };
  }
  const items = (list.items ?? []) as Item[];
  const due = items.filter((it) => {
  const d = readDate(it, cfg, KEY.due_date);
  return d !== "" && d <= today &&
    readSelectValue(it, cfg, KEY.status) === STATUS.active;
});

  if (!cfg.trigger_url) {
    await client.chat.postMessage({
      channel: cfg.channel_id,
      text: "ボタン用トリガーURLが未設定です。setup を再実行してください。",
    });
    return { completed: true, outputs: {} };
  }

  if (due.length === 0) {
    await client.chat.postMessage({ channel: cfg.channel_id, text: `【今日の復習】対象はありません (${today})` });
    return { completed: true, outputs: {} };
  }

  const wfBtn = (label: string, style: string, itemId: string, result: string) => ({
    type: "workflow_button",
    text: { type: "plain_text", text: label },
    style,
    workflow: {
      trigger: {
        url: cfg.trigger_url,
        customizable_input_parameters: [
          { name: "item_id", value: itemId },
          { name: "result", value: result },
        ],
      },
    },
  });

  for (const it of due) {
    const pnum = readText(it, cfg, KEY.problem_number);
    const url = readUrl(it, cfg);
    const stage = STAGE_BY_VALUE[readSelectValue(it, cfg, KEY.current_stage)] ?? "";
    await client.chat.postMessage({
      channel: cfg.channel_id,
      text: `今日の復習: 問題 ${pnum}`,
      blocks: [
        { type: "section", text: { type: "mrkdwn", text: `*問題 ${pnum}* (${stage})\n${url}` } },
        {
          type: "actions",
          elements: [
            wfBtn("✅ 解けた", "primary", it.id, "solved"),
            wfBtn("❌ 解けなかった", "danger", it.id, "not solved"),
          ],
        },
      ],
    });
  }
  return { completed: true, outputs: {} };
});

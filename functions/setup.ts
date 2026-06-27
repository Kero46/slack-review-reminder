import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { TriggerTypes } from "deno-slack-api/mod.ts";
import { KEY, listSchema } from "../lib/listdef.ts";
import { saveConfig } from "../lib/config_store.ts";

/**
 * setup（リンク1クリックで初期化）
 * 1. bot を通知チャンネルに参加させる
 * 2. slackLists.create で「復習問題リスト」を全列付きで生成
 * 3. レスポンスの schema から key→column_id を取得
 * 4. slackLists.access.set で通知チャンネルに write 共有
 * 5. apply_result のリンクトリガーを生成
 * 6. datastore に保存
 */
export const SetupFunction = DefineFunction({
  callback_id: "setup",
  title: "Setup review list",
  description: "復習リストを自動生成して初期設定する",
  source_file: "functions/setup.ts",
  input_parameters: {
    properties: {
      channel: { type: Schema.slack.types.channel_id, description: "通知先チャンネル" },
    },
    required: ["channel"],
  },
  output_parameters: {
    properties: { list_id: { type: Schema.types.string } },
    required: ["list_id"],
  },
});

// deno-lint-ignore no-explicit-any
type Col = { key?: string; id?: string; column_id?: string };

export default SlackFunction(SetupFunction, async ({ inputs, client }) => {
  const channel = inputs.channel;

  // 1. bot を通知チャンネルに参加させる（パブリックのみ自動で可）
  const joined = await client.conversations.join({ channel });
  if (!joined.ok) {
    // プライベートチャンネルは API で参加できないため手動追加を案内
    await client.chat.postMessage({
      channel,
      text:
        `このチャンネルにアプリを自動追加できませんでした（${joined.error}）。\n` +
        `プライベートチャンネルの場合は、チャンネル名をクリック →「インテグレーション」→「アプリを追加する」から ` +
        `このアプリを追加するか、メッセージ欄で /invite を実行してから、もう一度初期化してください。`,
    }).catch(() => {});
  }

  // 2. List 生成
  const created = await client.apiCall("slackLists.create", {
    name: "復習問題リスト",
    schema: listSchema(),
  });
  if (!created.ok) {
    await client.chat.postMessage({ channel, text: `セットアップ失敗（List生成）: ${created.error}` });
    return { error: `slackLists.create failed: ${created.error}` };
  }
  const listId: string = created.list_id ?? created.list?.id ?? "";

  // 3. key→column_id を取得
  const schema: Col[] = created.list_metadata?.schema ?? [];
  const cols: Record<string, string> = {};
  for (const c of schema) {
    const id = c.id ?? c.column_id;
    if (c.key && id) cols[c.key] = id;
  }
  const missing = Object.values(KEY).filter((k) => !cols[k]);
  if (missing.length) {
    await client.chat.postMessage({
      channel,
      text: `セットアップ警告: 一部の列IDを取得できませんでした: ${missing.join(", ")}`,
    });
  }

  // 4. チャンネルに write 共有
  const access = await client.apiCall("slackLists.access.set", {
    list_id: listId,
    access_level: "write",
    channel_ids: [channel],
  });
  if (!access.ok) {
    await client.chat.postMessage({ channel, text: `注意: チャンネル共有に失敗: ${access.error}（手動で List を共有してください）` });
  }

  // 5. apply_result のリンクトリガーを生成（ボタンが起動する先）
  let triggerUrl = "";
  try {
    const trig = await client.workflows.triggers.create({
      type: TriggerTypes.Shortcut,
      name: "復習結果を登録",
      description: "workflow_button から item_id/result を受け取る",
      workflow: "#/workflows/apply_result_wf",
      inputs: {
        item_id: { customizable: true },
        result: { customizable: true },
      },
    });
    if (trig.ok) {
      triggerUrl = trig.trigger?.shortcut_url ?? trig.trigger?.url ?? "";
    } else {
      await client.chat.postMessage({ channel, text: `注意: ボタン用トリガー作成に失敗: ${trig.error}` });
    }
  } catch (e) {
    await client.chat.postMessage({ channel, text: `注意: ボタン用トリガー作成で例外: ${String(e)}` });
  }

  // 6. datastore に保存
  try {
    await saveConfig(client, { list_id: listId, channel_id: channel, cols, trigger_url: triggerUrl });
  } catch (e) {
    await client.chat.postMessage({ channel, text: `セットアップ失敗（保存）: ${String(e)}` });
    return { error: `saveConfig failed: ${String(e)}` };
  }

  await client.chat.postMessage({
    channel,
    text: `セットアップ完了。復習問題リストを作成しました（list_id=${listId}）。\nこのチャンネルに共有済みです。問題登録フォームから問題を追加してください。`,
  });

  return { outputs: { list_id: listId } };
});

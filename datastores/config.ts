import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

// アプリ設定を1レコードに保存する。id は固定 "config"。
// list_id と、key→column_id の対応表(JSON文字列)、通知チャンネルを持つ。
export const ConfigDatastore = DefineDatastore({
  name: "algo_review_config",
  primary_key: "id",
  attributes: {
    id: { type: Schema.types.string },
    list_id: { type: Schema.types.string },
    channel_id: { type: Schema.types.string },
    columns_json: { type: Schema.types.string }, // {logicalKey: column_id, ...}
    trigger_url: { type: Schema.types.string }, // apply_result リンクトリガーのURL
  },
});

export default ConfigDatastore;

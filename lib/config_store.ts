import { ConfigDatastore } from "../datastores/config.ts";

const CONFIG_ID = "config";

export interface AppConfig {
  list_id: string;
  channel_id: string;
  cols: Record<string, string>; // logicalKey -> column_id
  trigger_url?: string; // apply_result リンクトリガーURL
}

// deno-lint-ignore no-explicit-any
type Client = any;

export async function saveConfig(client: Client, cfg: AppConfig): Promise<void> {
  const res = await client.apps.datastore.put({
    datastore: ConfigDatastore.name,
    item: {
      id: CONFIG_ID,
      list_id: cfg.list_id,
      channel_id: cfg.channel_id,
      columns_json: JSON.stringify(cfg.cols),
      trigger_url: cfg.trigger_url ?? "",
    },
  });
  if (!res.ok) throw new Error("config 保存に失敗: " + res.error);
}

export async function loadConfig(client: Client): Promise<AppConfig> {
  const res = await client.apps.datastore.get({
    datastore: ConfigDatastore.name,
    id: CONFIG_ID,
  });
  if (!res.ok || !res.item || !res.item.list_id) {
    throw new Error("未セットアップです。先に setup を実行してください。");
  }
  return {
    list_id: res.item.list_id,
    channel_id: res.item.channel_id,
    cols: JSON.parse(res.item.columns_json ?? "{}"),
    trigger_url: res.item.trigger_url ?? "",
  };
}

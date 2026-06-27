// Lists API のセル読み書き。列IDは datastore に保存した cols から引く。
// select の value は listdef.ts の固定値なので変換不要。空値セルは送らない。

import { KEY, STATUS, VALUE_BY_STAGE } from "./listdef.ts";
import type { AppConfig } from "./config_store.ts";
import type { ReviewState } from "./transition.ts";

type Field = {
  column_id?: string;
  key?: string;
  value?: unknown;
  date?: string[];
  select?: string[];
  text?: string;
  link?: { originalUrl?: string }[];
};
export type Item = { id: string; fields: Field[] };

function cellByCol(item: Item, columnId: string): Field | undefined {
  return item.fields.find((f) => f.column_id === columnId);
}

export function readDate(item: Item, cfg: AppConfig, logicalKey: string): string {
  return cellByCol(item, cfg.cols[logicalKey])?.date?.[0] ?? "";
}
export function readSelectValue(item: Item, cfg: AppConfig, logicalKey: string): string {
  return cellByCol(item, cfg.cols[logicalKey])?.select?.[0] ?? "";
}
export function readText(item: Item, cfg: AppConfig, logicalKey: string): string {
  const f = cellByCol(item, cfg.cols[logicalKey]);
  return f?.text ?? (typeof f?.value === "string" ? f.value : "");
}
export function readUrl(item: Item, cfg: AppConfig): string {
  const f = cellByCol(item, cfg.cols[KEY.url]);
  return f?.link?.[0]?.originalUrl ?? "";
}

type Cell = Record<string, unknown>;

/** ReviewState を cells に変換。空値のセルは含めない（クリアの未確認挙動に依存しない）。*/
export function buildCells(rowId: string, cfg: AppConfig, s: ReviewState): Cell[] {
  const cells: Cell[] = [];
  const putDate = (k: string, v: string) => {
    if (v) cells.push({ row_id: rowId, column_id: cfg.cols[k], date: [v] });
  };
  const putSelect = (k: string, value: string) => {
    if (value) cells.push({ row_id: rowId, column_id: cfg.cols[k], select: [value] });
  };
  putSelect(KEY.current_stage, VALUE_BY_STAGE[s.current_stage] ?? "");
  putSelect(KEY.status, s.status === "completed" ? STATUS.completed : STATUS.active);
  putDate(KEY.solved, s.solved);
  putDate(KEY.not_solved, s.not_solved);
  putDate(KEY.one_day, s.one_day);
  putDate(KEY.three_days, s.three_days);
  putDate(KEY.seven_days, s.seven_days);
  putDate(KEY.thirty_days, s.thirty_days);
  putDate(KEY.due_date, s.due_date);
  return cells;
}

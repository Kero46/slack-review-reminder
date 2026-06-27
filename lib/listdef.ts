// すべての土台。slackLists.create に渡す列定義と、固定の選択肢 value。
// value は自分で決めた既知値なので、ラベル↔ID変換が一切不要になる。
// column の実IDは生成時にレスポンスの key→id で取得して datastore に保存する。

export const TZ_OFFSET_HOURS = 9; // JST

// 論理キー（= slackLists.create の schema.key）。レスポンスから id を引くのに使う。
export const KEY = {
  problem_number: "problem_number",
  url: "url",
  current_stage: "current_stage",
  first_result: "first_result",
  result: "result",
  status: "status",
  solved: "solved_date",
  not_solved: "not_solved_date",
  one_day: "review_1day",
  three_days: "review_3days",
  seven_days: "review_7days",
  thirty_days: "review_30days",
  due_date: "due_date",
} as const;

// 固定の select option value（左:論理ラベル / 右:value）。
export const STAGE = {
  not_solved: "not_solved",
  one_day: "s1day",
  three_days: "s3days",
  seven_days: "s7days",
  thirty_days: "s30days",
  completed: "completed",
} as const;

export const STATUS = { active: "active", completed: "completed" } as const;
export const RESULT = { solved: "solved", not_solved: "not_solved" } as const;
export const FIRST = { solved: "solved", not_solved: "not_solved" } as const;

// current stage の value → 論理段階名（review_daily / transition で使う）
export const STAGE_BY_VALUE: Record<string, string> = {
  [STAGE.not_solved]: "not solved",
  [STAGE.one_day]: "1day review",
  [STAGE.three_days]: "3days review",
  [STAGE.seven_days]: "7days review",
  [STAGE.thirty_days]: "30days review",
  [STAGE.completed]: "completed",
};
// 論理段階名 → value
export const VALUE_BY_STAGE: Record<string, string> = Object.fromEntries(
  Object.entries(STAGE_BY_VALUE).map(([v, s]) => [s, v]),
);

// slackLists.create に渡す schema（列定義）。生成時に一度だけ使う。
export function listSchema() {
  const sel = (key: string, name: string, choices: { value: string; label: string; color: string }[]) => ({
    key, name, type: "select", options: { format: "single_select", choices },
  });
  const date = (key: string, name: string) => ({ key, name, type: "date" });
  return [
    { key: KEY.problem_number, name: "problem number", type: "text", is_primary_column: true },
    { key: KEY.url, name: "url", type: "link" },
    sel(KEY.current_stage, "current stage", [
      { value: STAGE.not_solved, label: "not solved", color: "gray" },
      { value: STAGE.one_day, label: "1day review", color: "blue" },
      { value: STAGE.three_days, label: "3days review", color: "cyan" },
      { value: STAGE.seven_days, label: "7days review", color: "indigo" },
      { value: STAGE.thirty_days, label: "30days review", color: "purple" },
      { value: STAGE.completed, label: "completed", color: "green" },
    ]),
    sel(KEY.first_result, "first result", [
      { value: FIRST.solved, label: "solved", color: "green" },
      { value: FIRST.not_solved, label: "not solved", color: "red" },
    ]),
    sel(KEY.result, "result", [
      { value: RESULT.solved, label: "solved", color: "green" },
      { value: RESULT.not_solved, label: "not solved", color: "red" },
    ]),
    sel(KEY.status, "status", [
      { value: STATUS.active, label: "active", color: "yellow" },
      { value: STATUS.completed, label: "completed", color: "green" },
    ]),
    date(KEY.solved, "solved date"),
    date(KEY.not_solved, "not solved date"),
    date(KEY.one_day, "1day review"),
    date(KEY.three_days, "3days review"),
    date(KEY.seven_days, "7days review"),
    date(KEY.thirty_days, "30days review"),
    date(KEY.due_date, "due date"),
  ];
}

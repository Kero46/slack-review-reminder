// 忘却曲線の状態遷移（純粋ロジック）。result/buttons どちらの経路でも共通。

export interface ReviewState {
  current_stage: string; // 論理段階名 "not solved" / "1day review" ...
  solved: string;
  not_solved: string;
  one_day: string;
  three_days: string;
  seven_days: string;
  thirty_days: string;
  due_date: string;
  status: string; // "active" / "completed"
}

export const REVIEW_STAGES = ["1day review", "3days review", "7days review", "30days review"];

export function todayISO(offsetHours = 9): string {
  return new Date(Date.now() + offsetHours * 3600_000).toISOString().slice(0, 10);
}
export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function computeTransition(
  stage: string,
  result: string,
  solvedDate: string,
  today: string,
): ReviewState {
  stage = (stage ?? "").trim();
  result = (result ?? "").trim();
  const anchor = (solvedDate ?? "").trim() || today;
  const dates = (a: string) => ({
    one_day: addDays(a, 1),
    three_days: addDays(a, 3),
    seven_days: addDays(a, 7),
    thirty_days: addDays(a, 30),
  });
  const base: ReviewState = {
    current_stage: stage, solved: solvedDate ?? "", not_solved: "",
    one_day: "", three_days: "", seven_days: "", thirty_days: "",
    due_date: "", status: "active",
  };

  // review 段階で失敗 → not solved に戻す（起点リセット）
  if (REVIEW_STAGES.includes(stage) && result === "not solved") {
    return { ...base, current_stage: "not solved", solved: "", not_solved: today, due_date: today, status: "active" };
  }
  if (result === "solved") {
    if (stage === "not solved") {
      return { ...base, solved: today, ...dates(today), current_stage: "1day review", due_date: addDays(today, 1) };
    }
    if (stage === "1day review") return { ...base, solved: anchor, ...dates(anchor), current_stage: "3days review", due_date: addDays(anchor, 3) };
    if (stage === "3days review") return { ...base, solved: anchor, ...dates(anchor), current_stage: "7days review", due_date: addDays(anchor, 7) };
    if (stage === "7days review") return { ...base, solved: anchor, ...dates(anchor), current_stage: "30days review", due_date: addDays(anchor, 30) };
    if (stage === "30days review") return { ...base, solved: anchor, ...dates(anchor), current_stage: "completed", due_date: "", status: "completed" };
  }
  return base;
}

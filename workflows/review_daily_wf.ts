import { DefineWorkflow } from "deno-slack-sdk/mod.ts";
import { ReviewDailyFunction } from "../functions/review_daily.ts";

export const ReviewDailyWorkflow = DefineWorkflow({
  callback_id: "review_daily_wf",
  title: "Daily review notify",
  input_parameters: { properties: {}, required: [] },
});
ReviewDailyWorkflow.addStep(ReviewDailyFunction, {});
export default ReviewDailyWorkflow;

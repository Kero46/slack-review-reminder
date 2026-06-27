import { Manifest } from "deno-slack-sdk/mod.ts";
import { SetupFunction } from "./functions/setup.ts";
import { AddProblemFunction } from "./functions/add_problem.ts";
import { ApplyResultFunction } from "./functions/apply_result.ts";
import { ReviewDailyFunction } from "./functions/review_daily.ts";
import { SetupWorkflow } from "./workflows/setup_wf.ts";
import { AddProblemWorkflow } from "./workflows/add_problem_wf.ts";
import { ApplyResultWorkflow } from "./workflows/apply_result_wf.ts";
import { ReviewDailyWorkflow } from "./workflows/review_daily_wf.ts";
import { ConfigDatastore } from "./datastores/config.ts";

export default Manifest({
  name: "slack-review-reminder",
  description: "Forgetting-curve review reminders in Slack (1/3/7/30 days)",
  functions: [SetupFunction, AddProblemFunction, ApplyResultFunction, ReviewDailyFunction],
  workflows: [SetupWorkflow, AddProblemWorkflow, ApplyResultWorkflow, ReviewDailyWorkflow],
  datastores: [ConfigDatastore],
  outgoingDomains: [],
  features: { workflowBuilder: { homeTabEnabled: false } },
  botScopes: [
    "chat:write",
    "channels:join",
    "lists:read",
    "lists:write",
    "datastore:read",
    "datastore:write",
    "triggers:write",
  ],
});
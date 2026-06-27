# slack-review-reminder

Forgetting-curve review reminders in Slack: solved problems are logged, missed
ones come back at **1, 3, 7, and 30 days**. Built entirely on Slack's
next-generation platform (Slack Lists + Workflows + custom Deno functions) — no
external DB or server.

- Problems solved on the first try → recorded only (never scheduled for review)
- Problems missed on the first try → reviewed at 1/3/7/30 days, counted from the
  day you finally solve them
- Every morning at 9:00 it posts the day's due problems with buttons; tapping a
  button records the result and advances the problem to its next stage

No manual collection of column IDs is required — `setup` creates the list via the
API, reads the generated column IDs, and stores them automatically.

## Project structure
```
slack-review-reminder/        # directory name is free to change
├── manifest.ts               # registers functions / workflows / datastore / scopes
├── deno.jsonc                # Deno import map
├── README.md
├── LICENSE
├── .gitignore                # ignores .slack/ (local CLI state) etc.
├── datastores/
│   └── config.ts             # stores list_id / channel / column map / trigger url
├── lib/
│   ├── listdef.ts            # list schema + fixed select values (source of truth)
│   ├── transition.ts         # forgetting-curve state transition (pure logic)
│   ├── config_store.ts       # datastore read/write
│   └── list_io.ts            # cell read / build update cells
├── functions/
│   ├── setup.ts              # create list, share, make trigger, save config
│   ├── add_problem.ts        # register one problem (form-driven)
│   ├── apply_result.ts       # apply a review result (fired by a button)
│   └── review_daily.ts       # post due problems with workflow_buttons
├── workflows/
│   ├── setup_wf.ts
│   ├── add_problem_wf.ts
│   ├── apply_result_wf.ts
│   └── review_daily_wf.ts
└── triggers/
    ├── setup.ts              # link: initialize
    ├── add_problem.ts        # link: add a problem
    ├── daily.ts              # scheduled: every morning 09:00
    └── test_daily.ts         # link: run the daily notify manually (optional)
```
Note: the `apply_result` trigger is created at runtime by `setup` (not a file here).

## Requirements
- A **paid Slack plan** (custom functions, the Lists API, and datastores are paid features)
- Permission to install a custom app in the target workspace
- macOS / Linux / WSL (the install commands below assume a Unix shell)

## Install the tools

### 1. Deno
```bash
curl -fsSL https://deno.land/install.sh | sh
```
Add Deno to your PATH (zsh shown; use ~/.bashrc for bash), then reload:
```bash
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
deno --version    # should print a version
```

### 2. Slack CLI
```bash
curl -fsSL https://downloads.slack-edge.com/slack-cli/install.sh | bash
slack version     # should print a version
```

### 3. Authorize the CLI
```bash
slack login       # opens the browser to authorize your workspace
```

If `slack deploy` later prints `runtime_not_found`, your shell can't see `deno` —
re-run the PATH step above. If it prints `invalid_app_directory`, run `slack init`
in the project folder first.

## Deploy
```bash
git clone https://github.com/<you>/slack-review-reminder.git
cd slack-review-reminder
slack deploy                  # deploy the app (run `slack init` first if asked)

# Create triggers (choose the DEPLOYED app, not local)
slack trigger create --trigger-def triggers/setup.ts
slack trigger create --trigger-def triggers/add_problem.ts
slack trigger create --trigger-def triggers/daily.ts        # set start_time to a future time
slack trigger create --trigger-def triggers/test_daily.ts   # manual test (optional)
```

## Usage
> **Private channel?** Add this app to the channel **before** running setup
> (channel name → Integrations → Add an App, or `/invite @<app name>` in the channel).
> Slack does not allow apps to join private channels via API, so this one step is manual.
> Public channels need no manual step — the app joins automatically.

1. Run the **"Initialize review system"** link → pick the notification channel in the form.
   The list is created, shared to that channel, and (for public channels) the bot joins.
2. Use the **"Add a problem"** link to register a problem
   (problem number / url / first result / base date).
3. Each morning at 9:00 the due problems are posted with buttons.
4. Tap **"✅ Solved / ❌ Not solved"** to advance a problem (works even if tapped later).

## Notes
- If `start_time` in `triggers/daily.ts` is in the past, trigger creation is rejected.
  Set it to a future time.
- Scheduled runs happen on the **deployed** app (`slack run` only runs while it is
  running locally).
- Running `setup` again creates a new list and overwrites the saved config
  (single `id: "config"` record), so the notification target switches to the new one.

## How it works
- `setup` joins the channel, calls `slackLists.create` to build the list with all
  columns and fixed select option values, captures the returned column IDs, shares the
  list to the channel via `slackLists.access.set`, creates the `apply_result` link
  trigger, and saves everything to a datastore.
- `add_problem` creates a row via `slackLists.items.create`.
- `review_daily` lists due items and posts them with `workflow_button`s that fire the
  `apply_result` link trigger — so a fresh run handles the click and it still works when
  tapped hours later.
- `apply_result` reads the row, computes the next state with `lib/transition.ts`, and
  updates the row via `slackLists.items.update`.

## License
MIT

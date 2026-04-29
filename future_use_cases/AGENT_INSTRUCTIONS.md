Agent Instructions — FarmConnect AI/ML Future Use Cases

Purpose
- Help any automation or AI agent resume work and update progress reliably.

How the agent should operate each new chat session
1. Checkout branch `feature/ai-future-ideas` if present.
2. Run `future_use_cases/update_progress.py` to refresh task statuses from the repo.
3. Read `future_use_cases/development_plan.json` and `future_use_cases/README.md` to understand current scope and next tasks.
4. When performing a task, update the `development_plan.json` `status` for that task to `in-progress` or `completed` and commit the change with a descriptive message.
5. Push changes to remote branch if remote exists and the agent has push permissions.

Conventions
- Task `check` fields reference filesystem paths; presence toggles `completed` when verified by the updater script.
- Task statuses: `not-started`, `in-progress`, `completed`.
- Commit messages must include `future_use_cases:` prefix.

Automation entrypoint
- Run from repo root:

```bash
python future_use_cases/update_progress.py
```

If Python environment is not available, run via `python3`.

Security
- Do not upload raw farmer images to public endpoints. Use on-device inference when privacy required.

Notes for human reviewers
- This folder contains architecture artifacts only; development must follow approvals in project governance.

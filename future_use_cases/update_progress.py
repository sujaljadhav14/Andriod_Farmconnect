#!/usr/bin/env python3
"""
Simple progress updater for future_use_cases/development_plan.json
Checks for presence of files listed in task `check` fields and updates statuses.
Runs in the repo root.
"""
import json
import os
from datetime import datetime

BASE = os.path.dirname(__file__)
PLAN_PATH = os.path.join(BASE, 'development_plan.json')


def load_plan():
    with open(PLAN_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_plan(plan):
    plan['last_updated'] = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
    with open(PLAN_PATH, 'w', encoding='utf-8') as f:
        json.dump(plan, f, indent=2)


def check_and_update(plan):
    changed = False
    for phase in plan.get('phases', []):
        for task in phase.get('tasks', []):
            check = task.get('check')
            if not check:
                continue
            path = os.path.join(os.path.dirname(BASE), check) if not os.path.isabs(check) else check
            exists = os.path.exists(path)
            if exists and task['status'] != 'completed':
                task['status'] = 'completed'
                changed = True
            if not exists and task['status'] == 'completed':
                # file removed — mark not-started to be safe
                task['status'] = 'not-started'
                changed = True
    return changed


def render_markdown(plan):
    md = []
    md.append(f"# Development Plan — {plan.get('project')}\n")
    md.append(f"_Last updated: {plan.get('last_updated')}_\n")
    for phase in plan.get('phases', []):
        md.append(f"## {phase['name']}\n")
        for task in phase.get('tasks', []):
            status = task.get('status', 'not-started')
            md.append(f"- **{task['title']}**: {status}")
        md.append('')
    out = os.path.join(BASE, 'development_plan.md')
    with open(out, 'w', encoding='utf-8') as f:
        f.write('\n'.join(md))
    print('Wrote', out)


def main():
    plan = load_plan()
    changed = check_and_update(plan)
    render_markdown(plan)
    if changed:
        save_plan(plan)
        print('Plan updated and saved to', PLAN_PATH)
    else:
        print('No changes detected')


if __name__ == '__main__':
    main()

# Project Plan

## Baseline

The current `main` branch is a role-based Expo prototype with demo screens for farmer, trader, and transporter workflows.

## Immediate Priorities

1. Keep the Expo dependency set aligned with SDK 54
2. Improve i18n behavior and coverage
3. Reduce structural drift in the transport area
4. Reconcile documentation with the actual repo contents
5. Evaluate branch integrations, especially `origin/mahek-dev`, from current `main`

## Integration Work For `mahek-dev`

1. Review the added `backend/` service and its dependencies
2. Remove hardcoded LAN URLs before keeping any backend calls
3. Port farmer crop flow changes without regressing newer `main` UI work
4. Validate navigation after integration
5. Decide whether backend code belongs in this repo or a separate service repo

## Follow-Up Work

1. Add a visible language switcher in the UI
2. Move mock data behind service abstractions
3. Add tests for critical navigation and translation behavior
4. Normalize docs and branch handoff workflow

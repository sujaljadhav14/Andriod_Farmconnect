# Farmer and Trader Gap Report

Date: 2026-04-24
Scope: Android app codebase parity review after transport dashboard completion pass.

## Farmer Gaps (Priority)

### P0 (Core workflow visibility)
- Delivery tracking visibility from farmer order flow is limited.
- Farmer should see transporter assignment, live location, and delivery status timeline directly from farmer order detail screens.

### P1 (Operational improvements)
- Crop to proposal to order traceability can be improved with direct deep-links between crop cards and accepted proposals/orders.
- Farmer post-delivery confirmation UX is not explicit in a dedicated flow (status and confirmation prompts are distributed).
- Farmer notification UX for transport milestones (accepted, in_transit, delivered, completed) is not surfaced as a focused in-app timeline card.

### P2 (Nice-to-have)
- Farmer post-delivery feedback/rating for transporter is not implemented.
- Farmer dispute quick-start from delivery context can be made one-tap and contextual.

## Trader Gaps (Priority)

### P0 (Core workflow visibility)
- Trader-side transport tracking is not exposed as a dedicated route planning or tracking screen from trader order journey.
- Transport milestone updates should be directly visible within trader order detail context.

### P1 (Operational improvements)
- Trader quick action to trigger transport assignment from order detail can be clearer and more guided.
- Trader delivery ETA visibility and route snapshot are not consolidated in a dedicated tracking widget.
- Trader completion confirmation and settlement summary flow can be made explicit after delivery.

### P2 (Nice-to-have)
- Trader to transporter rating/feedback flow is not present.
- Trader side analytics on delivery performance (on-time rate, cycle time) is not present.

## Cross-role Recommendations (Next Implementation Order)

1. Build shared delivery tracking module for farmer and trader order detail screens.
2. Add milestone notifications and timeline cards for both roles.
3. Add completion confirmation plus feedback/rating flow.
4. Add role-specific delivery analytics widgets.

## Notes
- This report focuses on visible workflow parity and transport-linked lifecycle consistency.
- Transport dashboard parity screens have been implemented in the transport module; remaining work is role-centric (farmer/trader) integration depth.

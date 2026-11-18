# Sprint planner

The planner takes a rough backlog and lays it out across the team by capacity. You paste a list, check the proposal, change anything you like and add it to the chart in one go. Then you adjust by dragging, as usual. Find it under **Planner** in a sprint's **Sprint insights** panel.

## Using it

1. Paste the backlog, one item per line. Bullets and numbering are ignored.
2. Add an estimate if you have one: `Saved cards (2d)`, `Gift cards | 3`, `Address book 4 days` or a T-shirt size, `Apple Pay (M)`. Sizes map to XS ½ day, S 1, M 2, L 3, XL 5.
3. Ask for a person with `@name`, such as `Order history @ben`.
4. Press **Plan it**. You get a capacity table per person and the proposed allocation, each with a reason.
5. Change any estimate or person in the table, then press **Add tasks to the chart**.

Items that don't fit anyone's remaining capacity are listed separately and not added.

## How it is worked out

- **Capacity** is the sprint's days minus each person's leave and distraction on the chart, multiplied by their **focus factor**, minus the work already on their lane.
- **Focus factor** is completed work over planned work across that person's last three completed sprints, kept between 50% and 120%. Someone who usually finishes 80% of what's planned gets 80% of their free days. People with no history get 100%.
- **Estimates**: items with no estimate get the median of the estimated ones (one day if none have an estimate). With an OpenAI key set, the model estimates unsized items instead, using the sized ones as reference. Model estimates are marked "estimated", and the badge shows whether AI was used.
- **Allocation**: `@name` requests are placed first, even if that person is over capacity (the reason says so). Then the biggest items go first, each to the person with the most free capacity. This is a greedy fit: quick, predictable and easy to explain.

The people offered are those on the sprint plus anyone from the last three completed sprints of the project.

## Why it works this way

- **AI estimates, rules allocate.** Guessing how long "Apple Pay" will take is a fuzzy question that a model can help with. Who has room is arithmetic, and arithmetic should be exact.
- **History beats optimism.** Using each person's own completion rate is the simplest honest correction for planning too much.
- **A proposal, not a decision.** The planner fills the chart so you can drag from there. Nothing is added until you press the button.

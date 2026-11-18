# Sprint forecast

The forecast tells you when the sprint is likely to land and which tasks are at risk, with a reason for each. Open a sprint and pick **Forecast** in the **Sprint insights** panel under the chart.

## What you see

- **Status**: on track, at risk, late, not started or done.
- **Forecast finish**: the sprint day the work is expected to finish, against the planned finish and the sprint's length.
- **Pace**: how much work has been done compared with what the plan says should be done by now. 100% means exactly on plan.
- **Scope added**: days of work added since the first snapshot.
- **ETA**: the forecast as a calendar date, counted forward from today in working days.
- **By person**: each lane's pace and forecast finish. The sprint lands when its slowest lane does.
- **At risk**: tasks that are likely to miss, each with its reasons.

Press **Why?** for a one-sentence explanation of the main cause. Without an AI key it is built from the biggest risk; with one, OpenAI writes it from the same data.

## How it is worked out

The forecast uses the live chart plus the sprint's daily [snapshots](Snapshots.md). Nothing is sampled or guessed.

1. **Earned work.** Each task earns part of its estimate based on its state: completed 100%, sign-off 90%, with QA 80%, in progress 40%, at risk 30%, blocked 20%, not started 0%. A 2-day task with QA has earned 1.6 days.
2. **Planned work by now.** Tasks sit end to end on each lane, so the chart says how much of each lane should be done by the current day.
3. **Pace.** Earned work divided by planned work, per lane. Pace is kept between 40% and 160% so one odd day doesn't swing the forecast wildly. A lane with less than half a day planned so far keeps a pace of 100%.
4. **Forecast finish.** Remaining work divided by pace, added to today, plus any leave or distraction still ahead on the lane.
5. **The sprint** lands on the latest lane's finish. It is **late** when that is more than a quarter of a day past the end, **at risk** when it is within half a day of the end or any task has a high-severity risk, and **on track** otherwise.

### At-risk reasons

| Reason | When it shows | Severity |
| --- | --- | --- |
| Past the end | Projected to finish after the sprint's last day | High |
| Behind plan | Should have been done by now but isn't near done | High from a day behind |
| Blocked | The task is blocked | High |
| Marked at risk | Someone set the task to At Risk | Medium |
| Estimate grew | The estimate rose by half a day or more since it first appeared | Medium |
| Slipped | Its planned end moved later by a day or more | Medium |
| Came back from QA | It went to QA and back to in progress | High if more than once |
| Was blocked | It spent two or more days blocked | Medium |
| Stale pull request | A linked open PR has had no activity for `STALE_PR_DAYS` days (3 by default) | Medium |

The history checks match tasks across snapshots by an origin id that each snapshot keeps, so renaming a task doesn't break them.

## Why it works this way

- **It is explainable.** Every number can be traced to the chart. When the forecast says a task is at risk, it says why, and the team can disagree with a specific reason instead of a black box.
- **It uses data you already have.** Moving the day marker already takes a snapshot. The forecast just reads them.
- **It is deliberately simple.** A pace per lane is easy to reason about and good enough to start a conversation. It is not a Monte Carlo simulation, and it doesn't pretend to be.
- **The ETA counts from today**, not from the chart's day marker, so it stays honest if nobody has moved the marker for a couple of days.

## Also available

- In the [customer portal](CustomerPortal.md) as an ETA with a confidence level.
- On [shared links](Sharing.md), read-only.
- Through [MCP](MCP.md) as `get_forecast` and `list_at_risk_tasks`.
- As the forecast landing date in the [iCal feed](Sharing.md).

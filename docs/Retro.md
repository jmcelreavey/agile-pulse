# Retro prompts

Retro prompts turn the sprint's replay into a starting list for the retrospective. Each prompt states something that actually happened, then asks an open question about it. Find them under **Retro** in a sprint's **Sprint insights** panel. They work for sprints in progress and completed ones.

## What you see

- **Numbers**: tasks, completed, slipped, QA bounces, blocked days and scope added.
- **Went well**: for example, "\"Card form\" was done on day 2, on or ahead of plan (day 2). What made this one go smoothly, and can we repeat it?"
- **To discuss**: slips, QA bounces, blocked time, work added mid-sprint and tasks that changed hands, with the biggest first.

Use **Copy** to take the list into your retro board.

## How it is worked out

Agile Pulse walks the sprint's [snapshots](Snapshots.md) in order and tracks each task through them: when it first appeared, how its estimate and planned end changed, how many days it spent in each state, how often it went from QA back to in progress and whether it moved between people. The prompts come from rules over that history:

| Prompt | Evidence |
| --- | --- |
| Slipped | The planned end moved later by a day or more |
| QA bounce | The task went to QA and came back |
| Blocked | Two or more days spent blocked |
| Scope | Work added after the first snapshot |
| Handoff | The task moved to a different person |
| Win | Finished on or ahead of its original plan, with no slip and no QA bounce |

The "to discuss" list is capped at eight, biggest first, so it stays usable.

## Why it works this way

- **Retros run on memory, and memory is poor.** By day ten, nobody remembers that a task bounced back from QA twice on day four. The snapshots do.
- **Evidence first, then a question.** Stating the fact plainly and asking an open question keeps the retro about the work, not about blame.
- **No AI needed.** The rules are short and the history is exact. A model would add cost and the chance of inventing things that didn't happen.

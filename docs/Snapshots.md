# Snapshots

Snapshots in Agile Pulse are used to create point-in-time views of the sprint chart. They are automatically generated when the current day marker is progressed, providing historical data for analysis and reporting.

## Key Features

### Snapshot Creation

- Snapshots are created automatically when the current day marker is progressed

### Snapshot Usage

- Snapshots can be used to create a time machine view of the sprint chart
- Snapshots can be used to generate reports of the sprint chart

### Snapshot Management

- Snapshots cannot currently be archived

## User Interactions

### Viewing Snapshots

- Snapshots can be viewed by clicking on the snapshot button in the top right of the sprint chart

### Time Machine View

- Users can navigate through historical snapshots to see how the sprint chart has evolved over time

### Reporting

- Snapshots can be used as the basis for generating sprint reports

## What reads snapshots

Snapshots are the sprint's history, and several features are built on them:

- the [forecast](Forecast.md) checks how estimates and planned ends changed, and how often tasks came back from QA,
- the [standup digest](Standup.md) compares the live chart with the latest snapshot,
- [retro prompts](Retro.md) replay every snapshot in order,
- the [planner](Planner.md) and the weekly customer update look at earlier sprints and earlier days.

Each task in a snapshot keeps the id of the live task it was copied from (`originTaskId`), so a task can be followed across snapshots even if it's renamed. Snapshots taken before that field existed are matched by name.

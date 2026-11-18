# Sprint Chart

The Sprint Chart is the main view in Agile Pulse, used to plan and track the progress of a sprint. It provides a visual representation of tasks, members, and deadlines over the course of a sprint.

## Components

The Sprint Chart consists of several key components:

### Timeline

- Shows days of the sprint (numbered or as weekdays if sprint is started)
- Supports zooming into specific days for detailed view
- Displays a reset zoom button when zoomed
- Automatically adjusts to show overrun days when tasks extend beyond sprint duration

### Tasks

- Visual blocks showing task duration and state
- Color-coded based on task state
- Can span multiple days
- Show percentage completion
- Support drag and drop for reordering
- Include external ticket links when available

### Member Lanes

- Shows tasks assigned to each member
- Supports drag and drop between members
- Displays member name and task count
- Adjusts to show visible portions of tasks when zoomed

### Unassigned Tasks

- Collapsible section for tasks not yet assigned to members
- Shows task details including duration and state
- Supports drag and drop to member lanes

### Markers and Deadlines

- Current Day Marker (red line)
- Sprint Start Marker (with date)
- Sprint End Marker (with date)
- Custom Deadlines (with configurable colors)
- All markers adjust position based on zoom level

#### How markers line up

Every day column, task block and marker is placed on one shared scale (`src/shared/logic/sprint/chart/timelineScale.ts`). Column `n` covers the time from `n - 1` to `n` days elapsed, so its left edge is the start of day `n`.

- **The red line marks the start of the current day.** Days elapsed is the sprint length minus the days remaining. The current day is the one you're in: 6 days elapsed and 6.5 days elapsed are both day 7, so the line sits on day 7's left edge in both cases. Its label says "Day 7" and the tooltip says how far through the day you are ("half done") and how many days are left. We use the start of the day, not the exact half-day point, because the chart is read in whole days ("what should be done by today?") and a line halfway across a column was read as being on the wrong day.
- Deadlines are set for the day ending, so a deadline on day 9 sits on the right edge of day 9.
- Positions are percentages of the bar, not pixels, so they hold at any screen width or browser zoom.
- The day header, every lane and the marker layer share the same left and right inset, so a marker at 50% is at 50% of every bar.
- A 13.5-day sprint is drawn as 14 columns. Day 14 is split: the first half is in the sprint and the second half is striped red as overrun, and its label shows ½.
- If the sprint runs past its planned length, the timeline grows to include today, so the red line never falls off the end.
- Zoomed views use the same scale, limited to the 2 or 3 visible days. A marker outside them is hidden.

#### Small screens

- The day header writes as much as fits in each column: "WED" and a zoom button on wide columns, "WED" on medium ones, the day number on narrow ones (a 14-day sprint on a phone), and every other day number on very narrow ones. Hover a column for the full day.
- Where there's no room for the zoom button, tap the day and use **Zoom into day N** in the dialog.
- Marker labels sit in a strip above the header and move up a row when they would overlap, so they never sit on top of each other. Each line starts at its own label.

**Why this design:** the line used to be placed in pixels from measured header widths plus a fixed 47px offset, while tasks were laid out with percentages. The two drifted at different widths, a half day was rounded down to the day before, and zoomed first/last days were a column out.

## Views and Navigation

### Standard View

- Shows full sprint timeline
- Displays all tasks and their full duration
- Includes overrun days if tasks extend beyond sprint duration

### Zoomed View

- Focuses on a specific day and its adjacent days
- Shows 2-3 days at a time depending on position:
  - First day: Shows days 1-2
  - Middle days: Shows previous, current, and next day
  - Last day: Shows second-last and last day (for a 13.5-day sprint, days 13-14)
- Adjusts task visibility to show only relevant portions
- Maintains deadline and marker visibility within view

## User Interactions

### Zoom Controls

- Click the zoom icon on any day to focus on that day (on narrow screens, tap the day and choose Zoom into day N)
- Use reset zoom button to return to full view
- Zoom state persists in URL for sharing

### Member Management

- Members can be re-ordered
- Tasks can be assigned/unassigned via drag and drop
- Click member name to edit member details

### Task Management

- Drag and drop tasks between days and members
- Click tasks to edit details
- Tasks automatically adjust visibility in zoomed view
- Support for external ticket links

### Deadline Management

- Click on timeline to add/edit deadlines
- Deadlines remain visible when in view
- Custom colors and descriptions supported

## States and Indicators

### Task States

- Color-coded for different states
- Visible in both standard and zoomed views
- State changes reflect immediately in the UI

### Sprint Progress

- Current day marker shows sprint progress
- Start and end dates clearly marked
- Overrun days highlighted in red

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
  - Last day: Shows second-last and last day
- Adjusts task visibility to show only relevant portions
- Maintains deadline and marker visibility within view

## User Interactions

### Zoom Controls

- Click zoom icon on any day to focus on that day
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

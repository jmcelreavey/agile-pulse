# Projects

Projects in Agile Pulse are used to group sprints and tasks. They provide a high-level organization structure for managing multiple sprints and related work items.

## Key Features

### Project Properties

- Projects can have a start date and end date
- Projects contain multiple sprints
- **Ticket URL Integration (Optional):**
  - `ticketUrlPrefix`: If you use an external issue tracker (e.g., Jira, GitHub Issues), you can set a prefix for your ticket IDs (e.g., `PROJ-`).
  - `ticketUrlTemplate`: You can provide a URL template for linking to external tickets. Use `{ticketId}` as a placeholder for the ticket ID. For example: `https://yourjira.com/browse/{ticketId}` or `https://github.com/yourorg/yourrepo/issues/{ticketId}`. When a task on the sprint chart has an external ticket ID set, this template will be used to generate a direct link.

### Project Management

- Projects can be added, edited, and archived

## User Interactions

### Creating and Editing Projects

- Users can create new projects
- Existing project details can be edited (including ticket URL settings)

### Managing Sprints

- Sprints can be added to and managed within projects

### Viewing Archived Sprints

- Archived sprints within a project can be viewed

# Archives

Agile Pulse prioritizes data preservation over deletion. The archiving system allows users to hide data from the UI without permanently removing it. Archived data is stored securely and can be restored when needed.

## Archiving Data

Archiving data is performed through the user interface.

### Supported Objects

The following objects support archiving:

- Projects
- Sprints
- Members
- Tasks
- Deadlines

### Cascading Archives

When an object is archived, the action cascades to all of its children. For example:

- Archiving a project will also archive all associated sprints, stories, tasks, and deadlines.
- Archiving a sprint will archive all tasks and deadlines within that sprint.

## Restoring Data

Archived data can be restored through the user interface.

### Restoration Process

When restoring an archived object:

1. The object is returned to its previous state before archiving.
2. The object is moved back to the project it was originally archived from.

### Cascading Restoration

Similar to archiving, restoration also cascades to child objects. When a parent object (e.g., a project or sprint) is restored, all its archived child objects are restored as well.

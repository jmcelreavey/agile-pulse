// Shared types and enums for changelog functionality
// Safe to import on both client and server

export enum ChangelogTone {
  FORMAL = "formal",
  INFORMAL = "informal",
  TECHNICAL = "technical",
}

export interface TaskData {
  id: number;
  name: string;
  description: string;
  state: string;
  assignedTo: string;
}

export interface ProjectContext {
  name: string;
  description: string;
  customerNames: string[];
}

export interface GenerateChangelogInput {
  tasks: TaskData[];
  projectContext: ProjectContext;
  sprintName: string;
  tone: ChangelogTone;
}

export interface ChangelogGenerationResult {
  content: string;
  tone: ChangelogTone;
  metadata: {
    taskCount: number;
    projectName: string;
    sprintName: string;
    generatedAt: Date;
  };
}

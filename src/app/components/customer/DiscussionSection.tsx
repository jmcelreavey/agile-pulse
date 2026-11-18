import { Divider, Stack, Title } from "@mantine/core";
import { CustomerCommentForm } from "~/app/components/customer/CustomerCommentForm";
import { DeveloperCommentForm } from "~/app/components/customer/DeveloperCommentForm";
import { UnifiedDiscussion } from "~/app/components/customer/UnifiedDiscussion";

interface DiscussionSectionProps {
  projectId?: string;
  sprintId?: string;
  title?: string;
}

export function DiscussionSection({
  projectId,
  sprintId,
  title = "Discussion",
}: DiscussionSectionProps) {
  return (
    <Stack gap="lg">
      <Title order={3}>{title}</Title>
      
      {/* Comment Forms */}
      <Stack gap="md">
        <CustomerCommentForm
          projectId={projectId}
          sprintId={sprintId}
        />
        
        <DeveloperCommentForm
          projectId={projectId}
          sprintId={sprintId}
        />
      </Stack>
      
      <Divider />
      
      {/* Unified Discussion Thread */}
      <UnifiedDiscussion
        projectId={projectId}
        sprintId={sprintId}
      />
    </Stack>
  );
}

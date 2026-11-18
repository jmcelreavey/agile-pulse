"use client";

import { printHtmlDocument } from "~/app/logic/common/PrintHtmlUtil";

import {
  Box,
  Button,
  Collapse,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  Title
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconCalendar, IconChevronDown, IconChevronUp, IconDownload } from "@tabler/icons-react";
import { api } from "~/trpc/react";

interface CustomerChangelog {
  id: number;
  content: string;
  createdAt: Date;
  sharedAt: Date | null;
  sharedViaEmail: boolean;
  exportedToPdf: boolean;
}

interface CustomerChangelogsProps {
  changelogs: CustomerChangelog[];
  sprintName: string;
  projectId: number;
  sprintId: number;
}

export function CustomerSprintChangelogs({ 
  changelogs, 
  sprintName, 
  projectId, 
  sprintId 
}: CustomerChangelogsProps) {
  const [opened, { toggle }] = useDisclosure(false); // Collapsed by default
  
  const exportPdfMutation = api.customer.exportChangelogPdf.useMutation({
    onSuccess: (data) => {
      // Trigger download if content is provided
      if (data.html && data.fileName) {
        printHtmlDocument(data.html, data.fileName);
      }
      
      notifications.show({
        title: "PDF ready",
        message: "Choose \"Save as PDF\" in the print dialog to download it",
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to export PDF",
        color: "red",
      });
    },
  });

  const handleExportPdf = (changelogId: number) => {
    exportPdfMutation.mutate({
      projectId,
      sprintId,
      changelogId,
    });
  };
  if (changelogs.length === 0) {
    return (
      <Paper p={0} withBorder>
        <Group
          p="md"
          justify="space-between"
          style={{ cursor: "pointer" }}
          onClick={toggle}
        >
          <Group gap="sm">
            <Title order={3}>Published Updates</Title>
            {opened ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
          </Group>
        </Group>
        <Collapse expanded={opened}>
          <Divider />
          <Stack gap="md" p="md">
            <Text c="dimmed" ta="center" py="xl">
              No updates have been published for this sprint yet.
            </Text>
          </Stack>
        </Collapse>
      </Paper>
    );
  }

  return (
    <Paper p={0} withBorder>
      <Group
        p="md"
        justify="space-between"
        style={{ cursor: "pointer" }}
        onClick={toggle}
      >
        <Group gap="sm">
          <Title order={3}>Published Updates</Title>
          {opened ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
        </Group>
      </Group>
      
      <Collapse expanded={opened}>
        <Divider />
        <Stack gap="md" p="md">
          <Text size="sm" c="dimmed">
            Here are the official updates and changelogs that have been shared for {sprintName}.
          </Text>
          
          <Stack gap="md">
            {changelogs.map((changelog) => (
              <Paper key={changelog.id} p="md" withBorder>
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start">
                    <Box>
                      <Group gap="xs" mb="xs">
                        <IconCalendar size={16} />
                        <Text size="sm" c="dimmed">
                          Published {new Date(changelog.createdAt).toLocaleDateString()}
                        </Text>
                      </Group>
                    </Box>
                    
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconDownload size={14} />}
                      onClick={() => handleExportPdf(changelog.id)}
                      loading={exportPdfMutation.isPending}
                    >
                      Download PDF
                    </Button>
                  </Group>
                  
                  <Divider />
                  
                  <Box>
                    <div
                      dangerouslySetInnerHTML={{ __html: changelog.content }}
                      style={{
                        lineHeight: 1.6,
                        fontSize: '14px',
                      }}
                    />
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Collapse>
    </Paper>
  );
}

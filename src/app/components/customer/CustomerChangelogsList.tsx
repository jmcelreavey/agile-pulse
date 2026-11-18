"use client";

import {
    Badge,
    Box,
    Divider,
    Group,
    Paper,
    Stack,
    Text,
    Title,
    Typography,
} from "@mantine/core";
import { IconFileTypePdf, IconMail } from "@tabler/icons-react";

interface PublishedChangelog {
  id: number;
  content: string;
  createdAt: Date;
  sharedAt: Date | null;
  sharedViaEmail: boolean;
  exportedToPdf: boolean;
}

interface CustomerChangelogsListProps {
  changelogs: PublishedChangelog[];
  sprintName: string;
}

export function CustomerChangelogsList({ 
  changelogs, 
  sprintName: _sprintName 
}: CustomerChangelogsListProps) {
  return (
    <Paper p="xl" withBorder>
      <Stack gap="md">
        <Title order={3}>Published Updates</Title>
        
        {changelogs.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No updates have been published for this sprint yet.
          </Text>
        ) : (
          <Stack gap="lg">
            {changelogs.map((changelog) => (
              <Paper key={changelog.id} p="md" withBorder>
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start">
                    <Box>
                      <Text size="sm" c="dimmed">
                        Published on {new Date(changelog.createdAt).toLocaleDateString()}
                      </Text>
                      {changelog.sharedAt && (
                        <Text size="xs" c="dimmed">
                          Shared on {new Date(changelog.sharedAt).toLocaleDateString()}
                        </Text>
                      )}
                    </Box>
                    
                    <Group gap="xs">
                      {changelog.sharedViaEmail && (
                        <Badge
                          size="xs"
                          variant="light"
                          color="blue"
                          leftSection={<IconMail size={10} />}
                        >
                          Emailed
                        </Badge>
                      )}
                      {changelog.exportedToPdf && (
                        <Badge
                          size="xs"
                          variant="light"
                          color="green"
                          leftSection={<IconFileTypePdf size={10} />}
                        >
                          PDF
                        </Badge>
                      )}
                    </Group>
                  </Group>
                  
                  <Divider />
                  
                  <Box>
                    <Typography>
                      <div dangerouslySetInnerHTML={{ __html: changelog.content }} />
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

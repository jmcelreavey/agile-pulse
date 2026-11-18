import { ActionIcon, Anchor, Group, Text } from "@mantine/core";
import { IconBrandGithub } from "@tabler/icons-react";
import { env } from "~/env";

const repoUrl = process.env.REPO_URL;

export const FooterActions = () => {
  return (
    <Group gap="sm">
      {env.DEMO_MODE && (
        <Text size="xs" c="dimmed" visibleFrom="xs">
          Demo data resets every day
        </Text>
      )}
      {repoUrl && (
        <ActionIcon
          variant="subtle"
          component="a"
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          size="lg"
          aria-label="Agile Pulse on GitHub"
        >
          <IconBrandGithub size="1.1rem" stroke={1.5} />
        </ActionIcon>
      )}
      <Anchor size="sm" href="https://mcelreavey.com" target="_blank" rel="noopener">
        Built by John McElreavey
      </Anchor>
    </Group>
  );
};

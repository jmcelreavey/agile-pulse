import { Container, Group } from "@mantine/core";
import { FooterActions } from "~/app/components/layout/FooterActions";

import { FooterLogo } from "~/app/components/layout/FooterLogo";

export const LayoutFooter = () => {
  return (
    <Container h="100%" fluid={true}>
      <Group justify="space-between" w="100%" gap={0} h="100%">
        <FooterLogo />
        <Group gap="xs">
          <FooterActions />
        </Group>
      </Group>
    </Container>
  );
};

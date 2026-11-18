import {
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
  Container,
} from "@mantine/core";
import { LayoutFooter } from "~/app/components/layout/LayoutFooter";
import { LayoutHeader } from "~/app/components/layout/LayoutHeader";
import { auth } from "~/server/auth";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <AppShell padding={0} header={{ height: 60 }} footer={{ height: 60 }}>
      <AppShellHeader zIndex={210}>
        <LayoutHeader session={session ?? undefined} />
      </AppShellHeader>

      <AppShellMain>
        <Container size="95%" pos="relative" my={24}>
          {children}
        </Container>
      </AppShellMain>

      <AppShellFooter zIndex={210}>
        <LayoutFooter />
      </AppShellFooter>
    </AppShell>
  );
}

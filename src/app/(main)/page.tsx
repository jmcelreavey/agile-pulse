import { Box, Stack } from "@mantine/core";
import { redirect } from "next/navigation";

import { ClientOnly } from "~/app/components/base/ClientOnly";
import { Dots } from "~/app/components/base/misc/Dots";
import classes from "~/app/styles/Home.module.css";
import { HomeUnAuthorisedView } from "~/app/views/HomeUnAuthorisedView";
import { ProjectsView } from "~/app/views/lazy";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

export default async function HomePage() {
  const session = await auth();

  // Redirect customers to the customer dashboard
  if (session?.user?.isCustomer) {
    redirect("/customer/dashboard");
  }

  // For regular users, prefetch data and render the projects view
  if (session?.user) {
    void api.project.getAll.prefetch();
    void api.jira.getConnectionStatus.prefetch();
    void api.changelog.getAll.prefetch({});
  }

  return (
    <HydrateClient>
      {!session?.user && (
        <>
          <Dots className={classes.dots} style={{ left: 0, top: 0 }} />
          <Dots className={classes.dots} style={{ left: 60, top: 0 }} />
          <Dots className={classes.dots} style={{ left: 0, top: 60 }} />
          <Dots className={classes.dots} style={{ right: 0, top: 60 }} />
          <Dots className={classes.dots} style={{ right: 0, top: 0 }} />
          <Dots className={classes.dots} style={{ right: 60, top: 0 }} />
        </>
      )}

      <Stack>
        <Box pos="relative" py={52}>
          {!session?.user ? (
            <HomeUnAuthorisedView />
          ) : (
            <ClientOnly>
              <ProjectsView />
            </ClientOnly>
          )}
        </Box>
      </Stack>
    </HydrateClient>
  );
}

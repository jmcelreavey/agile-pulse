"use client";

import { Burger, Center } from "@mantine/core";
import { useStore } from "~/app/store";

export const HeaderMobileBurger = () => {
  const store = useStore();

  return (
    <Center h="100%" hiddenFrom="xs">
      <Burger
        opened={store.dashboardMenu}
        onClick={() => store.toggleDashboardMenu()}
        size="sm"
        color="gray.6"
        py="xl"
        h="100%"
      />
    </Center>
  );
};

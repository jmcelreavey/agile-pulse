"use client";

import { Center, Loader } from "@mantine/core";
import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

/**
 * Renders its children only in the browser. The signed-in app reads data with suspense queries
 * that can only reach the API from the browser, so server rendering them would fail; the server
 * still prefetches what it can and hands it over through HydrateClient.
 */
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const isBrowser = useSyncExternalStore(subscribe, () => true, () => false);
  if (!isBrowser) {
    return (
      <Center py="xl">
        <Loader aria-label="Loading" />
      </Center>
    );
  }
  return children;
}

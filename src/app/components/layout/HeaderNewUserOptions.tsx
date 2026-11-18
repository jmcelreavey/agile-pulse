"use client";

import {
  ActionIcon,
  Group,
  Skeleton,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { IconBook, IconMoon, IconSun } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// Use a custom hook to communicate between components without prop drilling
export const useUserTypeStore = () => {
  const [userType, setUserType] = useState<"customer" | "developer">("developer");

  return {
    userType,
    setUserType,
    isCustomer: userType === "customer",
    isDeveloper: userType === "developer",
  };
};

export const HeaderNewUserOptions = () => {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light");
  const [effectiveColorScheme, setEffectiveColorScheme] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    setEffectiveColorScheme(computedColorScheme);
  }, [computedColorScheme]);

  return (
    <Group gap="xs">
      <ActionIcon component={Link} href="/docs" variant="subtle" size={36} aria-label="Documentation" title="Documentation">
        <IconBook size="1rem" />
      </ActionIcon>
      <ActionIcon
        variant="subtle"
        size={36}
        aria-label={computedColorScheme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        onClick={() =>
          setColorScheme(computedColorScheme === "light" ? "dark" : "light")
        }
      >
        {(() => {
          switch (effectiveColorScheme) {
            case "light":
              return <IconMoon size="1rem" />;
            case "dark":
              return <IconSun size="1rem" />;
            default:
              return <Skeleton width={24} height={24} />;
          }
        })()}
      </ActionIcon>
    </Group>
  );
};

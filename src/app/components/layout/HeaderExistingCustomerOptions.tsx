"use client";

import {
  Flex,
  Loader,
  Menu,
  MenuDropdown,
  MenuItem,
  MenuTarget,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconLogout, IconMoon, IconSun } from "@tabler/icons-react";
import { type Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { HeaderUserButton } from "~/app/components/layout/HeaderUserButton";

export const HeaderExistingCustomerOptions = ({
  session,
}: {
  session: Session;
}) => {
  const [openedMenu, { toggle }] = useDisclosure(false);
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light");
  const [logoutLoading, setLogoutLoading] = useState(false);

  return (
    <Flex
      align="center"
      gap={{
        base: "sm",
        xs: "lg",
      }}
    >
      <Menu
        position="bottom-end"
        opened={openedMenu}
        onChange={() => {
          toggle();
        }}
        withinPortal
        width={200}
      >
        <MenuTarget>
          <HeaderUserButton session={session} openedMenu={openedMenu} />
        </MenuTarget>

        <MenuDropdown>
          <MenuItem
            leftSection={
              computedColorScheme === "light" ? (
                <IconMoon size={16} />
              ) : (
                <IconSun size={16} />
              )
            }
            onClick={() =>
              setColorScheme(computedColorScheme === "light" ? "dark" : "light")
            }
            closeMenuOnClick={false}
          >
            {computedColorScheme === "light" ? "Dark mode" : "Light mode"}
          </MenuItem>
          <MenuItem
            onClick={async () => {
              setLogoutLoading(true);
              await signOut({
                redirect: true,
                callbackUrl: "/",
              });
            }}
            closeMenuOnClick={false}
            leftSection={
              logoutLoading ? (
                <Loader size={16} m={0} />
              ) : (
                <IconLogout
                  style={{
                    transform: "translateX(2px)",
                  }}
                  size={16}
                />
              )
            }
            disabled={logoutLoading}
          >
            Log out
          </MenuItem>
        </MenuDropdown>
      </Menu>
    </Flex>
  );
};

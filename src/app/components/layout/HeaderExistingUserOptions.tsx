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
import { IconBook, IconKey, IconLink, IconLogout, IconMoon, IconSun } from "@tabler/icons-react";
import Link from "next/link";
import { type Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ProjectSprintSelector } from "~/app/components/common/ProjectSprintSelector";
import { HeaderUserButton } from "~/app/components/layout/HeaderUserButton";
import JiraConnectionManager from "~/app/components/user/JiraConnectionManager";
import { useJiraConnectionModal } from "~/app/hooks/useJiraConnectionModal";

export const HeaderExistingUserOptions = ({
  session,
}: {
  session: Session;
}) => {
  const [openedMenu, { toggle }] = useDisclosure(false);
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light");
  const [logoutLoading, setLogoutLoading] = useState(false);

  const jiraConnectionModal = useJiraConnectionModal();

  const params = useParams<{ projectId?: string; sprintId?: string }>();
  const projectId = params.projectId;
  const sprintId = params.sprintId;

  return (
    <>
      <Flex
        align="center"
        gap={{
          base: "sm",
          xs: "lg",
        }}
      >
        <ProjectSprintSelector
          defaultProjectId={projectId}
          defaultSprintId={sprintId}
        />
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
              leftSection={<IconLink size={16} />}
              onClick={() => {
                jiraConnectionModal.open();
              }}
            >
              Configure Jira
            </MenuItem>
            <MenuItem component={Link} href="/settings" leftSection={<IconKey size={16} />}>
              API tokens &amp; MCP
            </MenuItem>
            <MenuItem component={Link} href="/docs" leftSection={<IconBook size={16} />}>
              Docs
            </MenuItem>
            <MenuItem
              leftSection={
                computedColorScheme === "light" ? (
                  <IconMoon size={16} />
                ) : (
                  <IconSun size={16} />
                )
              }
              onClick={() =>
                setColorScheme(
                  computedColorScheme === "light" ? "dark" : "light"
                )
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

      <JiraConnectionManager
        opened={jiraConnectionModal.opened}
        onClose={jiraConnectionModal.close}
      />
    </>
  );
};

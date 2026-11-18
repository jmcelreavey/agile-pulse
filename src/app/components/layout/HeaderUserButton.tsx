import {
  Box,
  Flex,
  Text,
  UnstyledButton,
  type UnstyledButtonProps,
} from "@mantine/core";
import { IconChevronDown, IconUserCircle } from "@tabler/icons-react";
import { type Session } from "next-auth";
import Image from "next/image";
import { forwardRef } from "react";

export const HeaderUserButton = forwardRef<
  HTMLButtonElement,
  {
    openedMenu: boolean;
    session: Session;
  } & UnstyledButtonProps
>(({ openedMenu = false, session, ...unstyledButtonProps }, ref) => {
  return (
    <UnstyledButton h="100%" {...unstyledButtonProps} ref={ref}>
      <Flex gap="xs" align="center">
        <Box
          style={{
            position: "relative",
            borderRadius: "50%",
            overflow: "hidden",
            width: 24,
            height: 24,
          }}
        >
          {session.user?.image ? (
            <Image
              src={session.user.image}
              alt="Profile picture"
              fill
              sizes="100%"
              priority
              style={{
                objectFit: "cover",
              }}
            />
          ) : (
            <IconUserCircle />
          )}
        </Box>

        <Box w={{ base: 100, sm: 140 }}>
          <Text size="xs" truncate fw="bold">
            {session.user?.name}
          </Text>
          <Text size="xs" truncate>
            {session.user?.email}
          </Text>
        </Box>

        <IconChevronDown
          size={16}
          style={{
            rotate: openedMenu ? "-180deg" : "0deg",
            transition: "all 0.25s",
          }}
        />
      </Flex>
    </UnstyledButton>
  );
});
HeaderUserButton.displayName = "HeaderUserButton";

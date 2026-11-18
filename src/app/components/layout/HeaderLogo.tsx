"use client";

import { Flex, Text, UnstyledButton } from "@mantine/core";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export const HeaderLogo = () => {
  return (
    <UnstyledButton component={Link} href={"/"}>
      <Flex gap="xs" align="center">
        <Image
          src="/images/logo.svg"
          alt="Agile Pulse Logo"
          width={32}
          height={32}
          priority
        />
        <Text fw={600} visibleFrom="xs">
          Agile Pulse
        </Text>
      </Flex>
    </UnstyledButton>
  );
};

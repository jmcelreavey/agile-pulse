import { Container, Flex } from "@mantine/core";
import { type Session } from "next-auth";
import { HeaderExistingCustomerOptions } from "~/app/components/layout/HeaderExistingCustomerOptions";
import { HeaderExistingUserOptions } from "~/app/components/layout/HeaderExistingUserOptions";
import { HeaderLogo } from "~/app/components/layout/HeaderLogo";
import { HeaderNewUserOptions } from "~/app/components/layout/HeaderNewUserOptions";

export const LayoutHeader = ({ session }: { session?: Session }) => {
  return (
    <Container h="100%" size={"90%"}>
      <Flex h="100%" align="center" justify="space-between" gap="xs">
        <Flex h="100%" align="center" gap="xs">
          <HeaderLogo />
        </Flex>

        {session?.user?.isCustomer && (
          <HeaderExistingCustomerOptions session={session} />
        )}

        {session?.user && !session?.user?.isCustomer && (
          <HeaderExistingUserOptions session={session} />
        )}

        {!session?.user && <HeaderNewUserOptions />}
      </Flex>
    </Container>
  );
};

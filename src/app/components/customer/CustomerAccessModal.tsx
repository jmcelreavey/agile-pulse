"use client";

import { Modal, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import ManageCustomersSection from "~/app/components/customer/ManageCustomersSection";

interface CustomerAccessModalProps {
  projectId: number;
  projectName: string;
  children: React.ReactNode;
}

export default function CustomerAccessModal({
  projectId,
  projectName,
  children,
}: CustomerAccessModalProps) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <div onClick={open} style={{ display: "inline-block" }}>
        {children}
      </div>
      <Modal
        opened={opened}
        onClose={close}
        title={<Text fw={600}>Customer Access</Text>}
        size="xl"
        closeOnClickOutside={false}
      >
        <ManageCustomersSection
          projectId={projectId}
          projectName={projectName}
          isInModal={true}
        />
      </Modal>
    </>
  );
}

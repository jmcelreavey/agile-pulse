import { ActionIcon, Flex, Transition, useMantineTheme } from "@mantine/core";
import { useHover } from "@mantine/hooks";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useEffect, useState } from "react";

const NavigationButtons = ({
  onBackClick,
  onForwardClick,
}: {
  onBackClick?: () => void;
  onForwardClick?: () => void;
}) => {
  const theme = useMantineTheme();
  const { hovered: hoveredLeft, ref: refLeft } = useHover();
  const { hovered: hoveredRight, ref: refRight } = useHover();
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check if it's a touch device
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
  }, []);

  return (
    <>
      {onBackClick && (
        <Flex
          align={"center"}
          justify={"center"}
          pos="fixed"
          top={0}
          bottom={0}
          left={0}
          w={"50px"}
          ref={refLeft}
          style={{ zIndex: 100 }}
        >
          <Transition
            mounted={isTouchDevice || hoveredLeft}
            transition="fade"
            duration={400}
            timingFunction="ease"
          >
            {(styles) => (
              <ActionIcon
                className="navigation-button"
                variant="filled"
                color={theme.primaryColor}
                size="xl"
                style={{ ...styles, transition: "all 0.4s ease" }}
                onClick={onBackClick}
              >
                <IconChevronLeft size={26} />
              </ActionIcon>
            )}
          </Transition>
        </Flex>
      )}

      {onForwardClick && (
        <Flex
          ref={refRight}
          align={"center"}
          justify={"center"}
          pos="fixed"
          top={0}
          bottom={0}
          right={0}
          w={"50px"}
          style={{ zIndex: 100 }}
        >
          <Transition
            mounted={isTouchDevice || hoveredRight}
            transition="fade"
            duration={400}
            timingFunction="ease"
          >
            {(styles) => (
              <ActionIcon
                className="navigation-button"
                variant="filled"
                color={theme.primaryColor}
                size="xl"
                style={{ ...styles, transition: "all 0.4s ease" }}
                onClick={onForwardClick}
              >
                <IconChevronRight size={26} />
              </ActionIcon>
            )}
          </Transition>
        </Flex>
      )}
    </>
  );
};

export default NavigationButtons;

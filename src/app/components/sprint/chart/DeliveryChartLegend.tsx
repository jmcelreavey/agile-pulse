import { Badge, Box, Divider, Group, rem } from "@mantine/core";
import { getStateColour, State } from "~/shared/types/State";

export const DeliveryChartLegend = () => {
  const values = Object.values(State);

  return (
    <Group my={rem(8)} mr={16} justify="right">
      {values.map((state, i) => {
        const colour = getStateColour(state);
        return (
          <Box key={i}>
            <Badge
              radius={"xs"}
              style={{
                textShadow: "0 0 5px black",
              }}
              color={colour}
            >
              {state}
            </Badge>
            {values.length !== i + 1 && <Divider orientation="vertical" />}
          </Box>
        );
      })}
    </Group>
  );
};

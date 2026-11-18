"use client";

import { Loader, type MantineTheme } from "@mantine/core";
import { RingLoader } from "~/app/components/base/loader/RingLoader";

export const mantineThemeConfig: Partial<MantineTheme> = {
  primaryColor: "teal",
  fontFamily: "Inter, sans-serif",
  components: {
    Loader: Loader.extend({
      defaultProps: {
        loaders: { ...Loader.defaultLoaders, ring: RingLoader },
      },
    }),
  },
};

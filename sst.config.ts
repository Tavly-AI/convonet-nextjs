// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "convonent-nextjs",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: input.stage === "production",
      home: "aws",
    };
  },
  async run() {
  },
});

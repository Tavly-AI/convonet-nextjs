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

    // ================================================
    // =================== KB LOGIC ===================
    // ================================================

    const KNOWLEDGE_BASE_BUCKETS = {
      production: {
        name: "convonent-bucket-prod",
        arn: "arn:aws:s3:::convonent-bucket-prod",
      },
      staging: {
        name: "convonent-bucket-stg",
        arn: "arn:aws:s3:::convonent-bucket-stg",
      },
    };

    const KNOWLEDGE_BASE_BUCKET = $app.stage === "production" ? KNOWLEDGE_BASE_BUCKETS.production.name : KNOWLEDGE_BASE_BUCKETS.staging.name;


    // ================================================
    // ================ SST RETURNS ===================
    // ================================================

    return {
      KNOWLEDGE_BASE_BUCKET,
    };
  },
});

## how to run inngest

# terminal 1
INNGEST_DEV=1 npm run dev

# temrminal 2
npx --ignore-scripts=false inngest-cli@latest dev \
  -u http://localhost:3000/api/batch-call/inngest/register-function
# LiveKit agent

Run the agent locally:

```bash
pnpm dev
```

Deploy it to LiveKit Cloud:

```bash
# First time only, after `lk cloud auth`
pnpm deploy:create

# Every later deployment
pnpm deploy
```

`pnpm deploy` first typechecks the agent against the Next.js configuration,
then builds `dist/main.js`. LiveKit Cloud receives that JavaScript bundle and
production dependencies only; it does not receive `src/` or the Next.js app.


# Misc

rm -f livekit.log && npm run dev 2>&1 | tee livekit.log

reset
clear
grep -Ei -C 5 "error|warn|TTS|LLM|speech|audio|firstFrame|cancel|disconnect" livekit.log
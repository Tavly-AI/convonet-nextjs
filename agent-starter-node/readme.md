rm -f livekit.log && npm run dev 2>&1 | tee livekit.log

reset
clear
grep -Ei -C 5 "error|warn|TTS|LLM|speech|audio|firstFrame|cancel|disconnect" livekit.log
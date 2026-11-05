Place the supplied background audio clips here as MP3 files, using the existing UI setting values:

- office.mp3
- cafe.mp3
- call_center.mp3
- street.mp3
- restaurant.mp3
- airport.mp3
- keyboard.mp3
- rain.mp3
- white_noise.mp3

Voice sessions loop the selected clip at `ambient_sound_volume` (default: 0.3).
`none`, unset selections, and chat sessions do not play background audio.
Missing clips log a warning and leave the call running without background audio.
The Docker image includes this folder; rebuild and deploy after adding clips.

import { voice } from '@livekit/agents';
import * as cartesia from '@livekit/agents-plugin-cartesia';
import * as elevenlabs from '@livekit/agents-plugin-elevenlabs';
import { ReadableStream, TransformStream } from 'node:stream/web';
import type { PronunciationDictionaryEntry } from '../../../../app/agents/_lib/session-storage/agent-session.ts';
import type { VoiceStack } from '../../ingestion/configure-voice-stack.ts';

// Apply only to TTS input, including greetings and flow transitions.
// https://docs.livekit.io/agents/models/tts/cartesia/#customizing-pronunciation
export function resolveSpeechSettingsPronunciation(tts: VoiceStack['tts'], dictionary: PronunciationDictionaryEntry[] | null | undefined): voice.textTransforms.TextTransform[] {

    const transforms: voice.textTransforms.TextTransform[] = ['filter_markdown', 'filter_emoji'];
    if (!dictionary?.length) return transforms;

    const isCartesia = tts instanceof cartesia.TTS
    const isElevenLabs = tts instanceof elevenlabs.TTS
    if (!isCartesia && !isElevenLabs) { console.warn('[Pronunciation] Dictionary unsupported by the selected TTS model.'); return transforms; }

    const replacements = new Map<string, string>();
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });

    for (const entry of dictionary) {
        const word = entry.word.trim();

        let phoneme = entry.phoneme.trim();
        if (!word || !phoneme) continue;

        try {
            if (entry.alphabet === 'ipa') phoneme = phoneme;
        } catch (error) {
            console.warn(`[Pronunciation] ${entry.alphabet} conversion failed:`, error);
            continue;
        }

        let pronunciation = '';
        if (isCartesia) { pronunciation = phoneme.split(/\s+/).map((part) => `<<${part.includes('|') ? part : Array.from(segmenter.segment(part), ({ segment }) => segment).filter((symbol) => symbol !== '.').join('|')}>>`).join(' '); }
        if (isElevenLabs) { pronunciation = `<phoneme alphabet="ipa" ph="${escapeXml(phoneme)}">${escapeXml(word)}</phoneme>`; }
        replacements.set(word, pronunciation);
    }
    if (replacements.size) transforms.push(createPronunciationTransform(replacements));
    return transforms;
}

// MISC CODE

function escapeXml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]!);
}

// Hold enough source text to match phrases even when LLM chunks split a word.
// Keep one extra character for the right boundary and never reprocess markup.
function createPronunciationTransform(replacements: ReadonlyMap<string, string>) {
    const entries = [...replacements].filter(([word]) => word.length > 0).sort(([a], [b]) => b.length - a.length);
    const maxLength = Math.max(0, ...entries.map(([word]) => word.length));
    const isWord = (character: string) => /[\p{L}\p{M}\p{N}_]/u.test(character);

    return (text: ReadableStream<string>): ReadableStream<string> => {
        let buffer = '';
        let previous = '';
        function drain(final: boolean): string {
            let output = '';
            while (buffer && (final || buffer.length > maxLength + 1)) {
                const match = entries.find(([word]) =>
                    buffer.slice(0, word.length).toLowerCase() === word.toLowerCase()
                    && !(isWord(word[0]!) && isWord(previous))
                    && !(isWord(word.at(-1)!) && isWord(buffer.slice(word.length, word.length + 1))),
                );
                const consumed = match?.[0].length ?? String.fromCodePoint(buffer.codePointAt(0)!).length;
                output += match?.[1] ?? buffer.slice(0, consumed);
                previous = Array.from(buffer.slice(0, consumed)).at(-1)!;
                buffer = buffer.slice(consumed);
            }
            return output;
        }
        return text.pipeThrough(new TransformStream<string, string>({
            transform(chunk, controller) {
                buffer += chunk;
                const output = drain(false);
                if (output) controller.enqueue(output);
            },
            flush(controller) {
                const output = drain(true);
                if (output) controller.enqueue(output);
            },
        }));
    };
}
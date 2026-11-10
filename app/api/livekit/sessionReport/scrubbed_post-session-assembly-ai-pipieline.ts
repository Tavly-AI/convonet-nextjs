import type { PiiPolicy, RedactedAudioResponse, Transcript } from "assemblyai"
import type { PiiCategory } from "@/app/agents/_lib/session-storage/agent-session"


const PII_POLICY_MAP = {
    person_name: ["person_name"],
    address: ["location"],
    email: ["email_address"],
    phone_number: ["phone_number"],
    ssn: ["us_social_security_number"],
    passport: ["passport_number"],
    driver_license: ["drivers_license"],
    credit_card: ["credit_card_number", "credit_card_cvv", "credit_card_expiration"],
    bank_account: ["banking_information"],
    password: ["password"],
    pin: ["password"],
    medical_id: ["healthcare_number"],
    date_of_birth: ["date_of_birth"],
    customer_account_number: ["account_number"],
} as const satisfies Record<PiiCategory, readonly PiiPolicy[]>

function getAssemblyAIPiiPolicies(categories?: readonly PiiCategory[]) {
    return [...new Set(categories === undefined ? Object.values(PII_POLICY_MAP).flat() : categories.flatMap(category => [...PII_POLICY_MAP[category]]))]
}

const PII_LABEL_PATTERN = new RegExp(`\\[(${getAssemblyAIPiiPolicies().map(policy => policy.toUpperCase()).join("|")})\\]`)

export async function redactAudioWithAssemblyAI(audioUrl: string, categories?: readonly PiiCategory[]) {

    const policies = getAssemblyAIPiiPolicies(categories)
    if (!policies.length) { return { assembly_ai_raw_redactedAudioUrl: audioUrl, assembly_ai_raw_replacements: {} } }

    const apiKey = process.env.ASSEMBLYAI_API_KEY
    if (!apiKey) throw new Error("Missing ASSEMBLYAI_API_KEY")

    const signal = AbortSignal.timeout(600_000)

    async function request<T extends { status: string; error?: string | null }>(path: string, body?: object): Promise<T> {
        const response = await fetch(`https://api.assemblyai.com/v2${path}`, { method: body ? "POST" : "GET", headers: { authorization: apiKey!, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, cache: "no-store", signal, })
        if (!response.ok) throw new Error(`AssemblyAI HTTP ${response.status}`)

        const data = await response.json() as T
        if (data.error || data.status === "error") { throw new Error(data.error || "AssemblyAI processing failed") }
        return data
    }

    const { id } = await request<Transcript>("/transcript", {
        audio_url: audioUrl,
        language_detection: true,
        redact_pii: true,
        redact_pii_return_unredacted: true,
        redact_pii_policies: policies,
        redact_pii_sub: "entity_name",
        redact_pii_audio: true,
    })
    if (!id) throw new Error("Missing transcript ID")

    async function poll<T extends { status: string; error?: string | null }>(path: string, status: T["status"]): Promise<T> {
        while (true) {
            const data = await request<T>(path)
            if (data.status === status) return data
            await new Promise(resolve => setTimeout(resolve, 3000))
        }
    }

    const transcript = await poll<Transcript>(`/transcript/${id}`, "completed")
    const replacements = extractReplacements(transcript)
    const audio = await poll<RedactedAudioResponse>(`/transcript/${id}/redacted-audio`, "redacted_audio_ready")
    if (!audio.redacted_audio_url) throw new Error("Missing redacted audio URL")

    return { assembly_ai_raw_redactedAudioUrl: audio.redacted_audio_url, assembly_ai_raw_replacements: replacements }
}


// MISC CODE

function extractReplacements(transcript: Transcript): Record<string, string> {
    if (!transcript.words) throw new Error("Missing redacted words")
    const spans: { label: string; start: number; end: number; prefix: string; suffix: string }[] = []
    let previousLabel: string | undefined

    for (const word of transcript.words) {
        const match = word.text.match(PII_LABEL_PATTERN)
        const label = match?.[0]
        const prefix = match ? word.text.slice(0, match.index) : ""
        const suffix = match ? word.text.slice(match.index! + match[0].length) : ""
        const previous = spans.at(-1)
        if (label && previous && label === previousLabel && !previous.suffix && !prefix) {
            previous.end = Math.max(previous.end, word.end)
            previous.suffix = suffix
        } else if (label) {
            spans.push({ label, start: word.start, end: word.end, prefix, suffix })
        }
        previousLabel = label
    }

    if (!spans.length) return {}
    if (!transcript.unredacted_words?.length) throw new Error("Missing original words for PII extraction")

    // Match timestamps rather than array positions: one placeholder may replace several words.
    return Object.fromEntries(spans.map(span => {
        let phrase = transcript.unredacted_words!
            .filter(word => word.start < span.end && word.end > span.start)
            .map(word => word.text)
            .join(" ")
            .trim()
        // Keep punctuation such as the period in "Apoorv." outside the replacement.
        if (span.prefix && phrase.startsWith(span.prefix)) phrase = phrase.slice(span.prefix.length)
        if (span.suffix && phrase.endsWith(span.suffix)) phrase = phrase.slice(0, -span.suffix.length)
        phrase = phrase.trim()
        if (!phrase) throw new Error("Could not align a redacted phrase with original words")
        return [phrase, span.label]
    }))
}

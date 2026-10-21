import Papa from "papaparse"
import type { BatchCallGlobalType } from "./batch-call-global-types"
import { batchCallCreateSchema } from "./batch-call-global-types"

export async function batchCallParseFile(file: File): Promise<BatchCallGlobalType["task"][]> {

    if (!file.name.toLowerCase().endsWith(".csv")) { throw new Error("Please upload a CSV file") }

    const csv = await file.text()
    const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: "greedy", transformHeader: (header) => header.trim(), })
    if (parsed.errors.length) { throw new Error(`Invalid CSV: ${parsed.errors[0].message}`) }
    if (!parsed.meta.fields?.includes("to_number")) { throw new Error("CSV must contain a to_number column") }

    const tasks: BatchCallGlobalType["task"][] = parsed.data.map((row) => {
        const { to_number, ...variables } = row

        return {
            to_number: to_number?.trim() ?? "",
            llm_dynamic_variables: Object.fromEntries(Object.entries(variables).filter(([key]) => key.trim()).map(([key, value]) => [key, String(value ?? "").trim()])),
        }
    })

    const validated = batchCallCreateSchema.shape.tasks.safeParse(tasks)

    if (!validated.success) {
        const issue = validated.error.issues[0]
        const rowIndex = typeof issue.path[0] === "number" ? issue.path[0] + 2 : null
        throw new Error(`${rowIndex ? `CSV row ${rowIndex}: ` : ""}${issue.message}`)
    }

    return validated.data
}
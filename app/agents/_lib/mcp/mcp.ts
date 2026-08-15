export type McpConfig = {
  name: string
  url: string
  headers: Record<string, string>
  query_params: Record<string, string>
  timeout_ms: number
}

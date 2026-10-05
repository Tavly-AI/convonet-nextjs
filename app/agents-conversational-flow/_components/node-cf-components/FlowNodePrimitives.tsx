import { Handle, Position } from "@xyflow/react"
import { Equal } from "lucide-react"
import type { ReactNode } from "react"
import type { CF } from "../../_types/global-cf-types"

const palette = {
    cyan: { border: "border-cyan-500/70", selected: "border-cyan-400 ring-2 ring-cyan-500/30", handle: "!bg-cyan-500", text: "text-cyan-400" },
    blue: { border: "border-blue-500/70", selected: "border-blue-400 ring-2 ring-blue-500/30", handle: "!bg-blue-500", text: "text-blue-400" },
    orange: { border: "border-orange-500/70", selected: "border-orange-400 ring-2 ring-orange-500/30", handle: "!bg-orange-500", text: "text-orange-400" },
    yellow: { border: "border-yellow-500/70", selected: "border-yellow-400 ring-2 ring-yellow-500/30", handle: "!bg-yellow-500", text: "text-yellow-400" },
    pink: { border: "border-pink-500/70", selected: "border-pink-400 ring-2 ring-pink-500/30", handle: "!bg-pink-500", text: "text-pink-400" },
    green: { border: "border-green-600/70", selected: "border-green-400 ring-2 ring-green-500/30", handle: "!bg-green-500", text: "text-green-400" },
    zinc: { border: "border-zinc-600", selected: "border-zinc-300 ring-2 ring-zinc-400/30", handle: "!bg-zinc-400", text: "text-zinc-400" },
    teal: { border: "border-teal-500/70", selected: "border-teal-400 ring-2 ring-teal-500/30", handle: "!bg-teal-500", text: "text-teal-400" },
}

export function FlowNodeCard({ children, selected, color, className = "" }: { children: ReactNode; selected: boolean; color: keyof typeof palette; className?: string }) {
    return <div className={`w-[300px] rounded-2xl border bg-[#1c1c21] p-1 shadow-2xl ${selected ? palette[color].selected : palette[color].border} ${className}`}>{children}</div>
}

export function InputHandle({ color, top = 25 }: { color: keyof typeof palette; top?: number }) {
    return <Handle type="target" position={Position.Left} className={`!size-4 !border-2 !border-white ${palette[color].handle}`} style={{ top }} />
}

export function EdgeRow({ edge, color, label, onLabelChange, onClick, actions }: { edge: CF["Edge"]; color: keyof typeof palette; label?: string; onLabelChange?: (label: string) => void; onClick?: () => void; actions?: ReactNode }) {
    const edgeLabel = label ?? (edge.transition_condition.type === "prompt" ? edge.transition_condition.prompt : "Set a condition")

    return <div className="relative px-1 pb-1">
        <div className="nodrag flex min-h-10 items-center gap-2 rounded-xl bg-[#121216] px-3 text-sm text-zinc-300">
            <Equal className="size-4 shrink-0 text-zinc-500" />
            {onLabelChange ? (
                <input
                    value={edgeLabel}
                    onChange={(event) => onLabelChange(event.target.value)}
                    aria-label="Transition condition"
                    className="nodrag nowheel min-w-0 flex-1 bg-transparent outline-none placeholder:text-zinc-500"
                />
            ) : <button type="button" onClick={onClick} className={onClick ? "min-w-0 flex-1 truncate text-left" : "min-w-0 flex-1 truncate text-left"}>{edgeLabel}</button>}
            {actions}
        </div>
        <Handle id={edge.id} type="source" position={Position.Right} className={`!size-4 !border-2 !border-white ${palette[color].handle}`} style={{ top: "50%" }} />
    </div>
}

export function NodeHeader({ icon, title, color, className = "", titleClassName = "", titleSuffix, actions }: { icon: ReactNode; title: string; color: keyof typeof palette; className?: string; titleClassName?: string; titleSuffix?: ReactNode; actions?: ReactNode }) {
    return <div className={`flex h-11 items-center gap-2 px-3 ${actions ? "justify-between" : ""} ${palette[color].text} ${className}`}><div className="flex items-center gap-2">{icon}<span className={`text-sm font-medium ${titleClassName}`}>{title}</span>{titleSuffix}</div>{actions}</div>
}

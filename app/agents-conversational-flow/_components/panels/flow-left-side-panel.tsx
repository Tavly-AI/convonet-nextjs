import {
    Bot,
    // Braces,
    Code2,
    GitBranch,
    MessageSquare,
    Network,
    PhoneForwarded,
    PhoneOff,
    Smartphone,
    // StickyNote,
    // Variable,
} from "lucide-react"

const nodeItems = [
    {
        type: "conversation",
        label: "Conversation",
        icon: MessageSquare,
        iconClass: "bg-pink-500/15 text-pink-400",
    },
    {
        type: "subagent",
        label: "Subagent",
        icon: Bot,
        iconClass: "bg-green-500/15 text-green-400",
    },
    // {
    //     type: "function",
    //     label: "Function",
    //     icon: Braces,
    //     iconClass: "bg-purple-500/15 text-purple-400",
    // },
    {
        type: "transfer_call",
        label: "Call Transfer",
        icon: PhoneForwarded,
        iconClass: "bg-yellow-500/15 text-yellow-400",
    },
    {
        type: "press_digit",
        label: "Press Digit",
        icon: Smartphone,
        iconClass: "bg-cyan-500/15 text-cyan-400",
    },
    {
        type: "branch",
        label: "Logic Split",
        icon: GitBranch,
        iconClass: "bg-blue-500/15 text-blue-400",
    },
    {
        type: "agent_swap",
        label: "Agent Transfer",
        icon: Network,
        iconClass: "bg-orange-500/15 text-orange-400",
    },
    {
        type: "sms",
        label: "In-Call SMS",
        icon: MessageSquare,
        iconClass: "bg-yellow-500/15 text-yellow-400",
    },
    // {
    //     type: "extract-variable",
    //     label: "Extract Variable",
    //     icon: Variable,
    //     iconClass: "bg-zinc-500/15 text-zinc-400",
    // },
    {
        type: "code",
        label: "Code",
        icon: Code2,
        iconClass: "bg-zinc-500/15 text-zinc-400",
    },
    {
        type: "end",
        label: "Ending",
        icon: PhoneOff,
        iconClass: "bg-teal-500/15 text-teal-400",
    },
    // {
    //     type: "mcp",
    //     label: "MCP",
    //     icon: Network,
    //     iconClass: "bg-indigo-500/15 text-indigo-400",
    // },
    // {
    //     type: "note",
    //     label: "Note",
    //     icon: StickyNote,
    //     iconClass: "bg-yellow-500/15 text-yellow-400",
    // },
]

export function FlowLeftSidePanel() {

    function onDragStart(
        event: React.DragEvent<HTMLButtonElement>,
        nodeType: string
    ) {
        event.dataTransfer.setData("application/reactflow", nodeType)
        event.dataTransfer.effectAllowed = "move"
    }

    return (
        <aside className="absolute left-3 top-3 z-10 w-[230px] rounded-2xl border border-zinc-800 bg-[#1c1c21] p-2 shadow-xl">
            <div className="mb-3 grid grid-cols-2 rounded-xl bg-[#242429] p-1">
                <button className="rounded-lg bg-[#2c2c32] px-3 py-1.5 text-sm font-medium text-zinc-200">
                    Node
                </button>

                <button className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 transition hover:text-zinc-300">
                    Subflows
                </button>
            </div>

            <div className="space-y-0.5">
                {nodeItems.map(({ type, label, icon: Icon, iconClass }) => (
                    <button
                        key={label}
                        draggable
                        onDragStart={(event) => onDragStart(event, type)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-zinc-800/70"
                    >
                        <span className={`grid size-7 shrink-0 place-items-center rounded-md ${iconClass}`}>
                            <Icon className="size-4" />
                        </span>

                        <span className="text-[13px] font-medium text-zinc-300">
                            {label}
                        </span>
                    </button>
                ))}
            </div>
        </aside>
    )
}

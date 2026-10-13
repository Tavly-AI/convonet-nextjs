import {
    Bot,
    ChevronDown,
    CircleDot,
    Braces,
    Code2,
    Cuboid,
    GitBranch,
    MessageSquare,
    MoreHorizontal,
    Network,
    Pencil,
    PhoneForwarded,
    PhoneOff,
    Plus,
    Search,
    Smartphone,
    Workflow,
    // StickyNote,
    // Variable,
} from "lucide-react"
import { useEffect, useState } from "react"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import type { CFSubflowComponent } from "../../_types/global-cf-types"
import { subflow_session_storage } from "../../_lib/flow-subflow-sessonStorage"
import { createCFNode } from "../../_lib/flow-node-factory"

const nodeItems = [
    {
        type: "begin",
        label: "Begin",
        icon: CircleDot,
        iconClass: "bg-violet-500/15 text-violet-400",
    },
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
    {
        type: "function",
        label: "Custom Function",
        icon: Braces,
        iconClass: "bg-purple-500/15 text-purple-400",
    },
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
    // {
    //     type: "agent_swap",
    //     label: "Agent Transfer",
    //     icon: Network,
    //     iconClass: "bg-orange-500/15 text-orange-400",
    // },
    // {
    //     type: "sms",
    //     label: "In-Call SMS",
    //     icon: MessageSquare,
    //     iconClass: "bg-yellow-500/15 text-yellow-400",
    // },
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
    return (
        <aside className="absolute left-4 top-20 z-10 w-60 overflow-hidden rounded-xl border bg-card/50 shadow-lg">
            <Tabs defaultValue="nodes" className="w-full">
                <div className="border-b p-2">
                    <TabsList className="grid h-9 w-full grid-cols-2">
                        <TabsTrigger value="nodes" className="text-xs">
                            Nodes
                        </TabsTrigger>
                        <TabsTrigger value="subflows" className="text-xs">
                            Subflows
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="p-2">
                    <TabsContent value="nodes" className="m-0">
                        <DisplayNodes />
                    </TabsContent>
                    <TabsContent value="subflows" className="m-0">
                        <DisplaySubflows />
                    </TabsContent>
                </div>
            </Tabs>
        </aside>
    )
}


function DisplayNodes() {
    function onDragStart(
        event: React.DragEvent<HTMLButtonElement>,
        nodeType: string
    ) {
        event.dataTransfer.setData("application/reactflow", nodeType)
        event.dataTransfer.effectAllowed = "move"
    }

    return (
        <div className="space-y-0.5">
            {nodeItems.map(({ type, label, icon: Icon, iconClass }) => (
                <button
                    key={type}
                    draggable
                    onDragStart={(event) => onDragStart(event, type)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-muted"
                >
                    <span className={`grid size-7 shrink-0 place-items-center rounded-md ${iconClass}`}>
                        <Icon className="size-4" />
                    </span>

                    <span className="text-[13px] font-medium text-foreground">
                        {label}
                    </span>
                </button>
            ))}
        </div>
    )
}


function DisplaySubflows() {
    const [subflows, setSubflows] = useState<CFSubflowComponent[]>([])

    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        setSubflows(Object.values(subflow_session_storage.getAll()))
    }, [])

    function onSubflowClick(id: string) {
        const params = new URLSearchParams(searchParams.toString())
        params.set("subflow", id)
        router.push(`?${params.toString()}`)
    }

    function createSubflow() {
        const id = crypto.randomUUID()

        const startNode = createCFNode("subflow_start", { x: 100, y: 100 })
        const endNode = createCFNode("subflow_end", { x: 600, y: 100 })

        const subflow: CFSubflowComponent = {
            conversation_flow_component_id: id,
            name: "New Subflow",
            nodes: [startNode, endNode],
        }

        subflow_session_storage.set(subflow)

        setSubflows(Object.values(subflow_session_storage.getAll()))

        onSubflowClick(id)
    }

    function onDragStart(
        event: React.DragEvent<HTMLButtonElement>,
        subflowId: string
    ) {
        event.dataTransfer.setData("application/reactflow", "subflow")
        event.dataTransfer.setData("application/subflow-id", subflowId)
        event.dataTransfer.effectAllowed = "move"
    }


    return (
        <div className="space-y-5">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                    placeholder="Search..."
                    className="h-10 pl-9"
                />
            </div>

            {/* Library Subflows */}
            <section>
                <div className="mb-2 flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
                        <ChevronDown className="size-3.5" />
                        <span>Library Subflows</span>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                    >
                        <Plus className="size-4" />
                    </Button>
                </div>

                <div className="flex h-24 items-center justify-center rounded-lg bg-muted/40 px-4 text-center text-sm text-muted-foreground">
                    No library subflows
                    <br />
                    available
                </div>
            </section>

            {/* Agent Subflows */}
            <section>
                <div className="mb-2 flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
                        <ChevronDown className="size-3.5" />
                        <span>Agent Subflows</span>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={createSubflow}
                    >
                        <Plus className="size-4" />
                    </Button>
                </div>

                <div className="space-y-1">
                    {subflows.map((subflow) => (
                        <button
                            key={subflow.conversation_flow_component_id}
                            type="button"
                            draggable
                            onDragStart={(event) => onDragStart(event, subflow.conversation_flow_component_id!)}
                            className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted"
                        >
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-500">
                                <Cuboid className="size-4" />
                            </span>

                            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                {subflow.name}
                            </span>

                            <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                                <Pencil className="size-4 text-muted-foreground" onClick={() => onSubflowClick(subflow.conversation_flow_component_id!)} />
                                <MoreHorizontal className="ml-2 size-4 text-muted-foreground" />
                            </div>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    )
}
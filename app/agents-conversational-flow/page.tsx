"use client"

import { Background, BackgroundVariant, MiniMap, Panel, ReactFlow, ReactFlowProvider, useNodesState, useReactFlow, useViewport, type Connection, type Edge } from "@xyflow/react"
import { Hand, Map as MapIcon, Minus, MousePointer2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FlowLeftSidePanel } from "./_components/panels/flow-left-side-panel"
import dynamic from "next/dynamic"
import Loading from "@/app/loading"
import { FlowConversationNodeType } from "./_components/node-cf-components/ConversationFlowNode"
import { FlowSubAgentsNodeType } from "./_components/node-cf-components/SubAgentsFlowNode"
import { createCFNode } from "./_lib/flow-node-factory"
import { FlowBeginNodeType } from "./_components/node-cf-components/BeginFlowNode"
import { CallTransferFlowNode } from "./_components/node-cf-components/CallTransferFlowNode"
import { PressDigitFlowNode } from "./_components/node-cf-components/PressDigitFlowNode"
import { LogicSplitFlowNode } from "./_components/node-cf-components/LogicSplitFlowNode"
import { AgentTransferFlowNode } from "./_components/node-cf-components/AgentTransferFlowNode"
import { SmsFlowNode } from "./_components/node-cf-components/SmsFlowNode"
import { CustomFunctionFlowNode } from "./_components/node-cf-components/CustomFunctionFlowNode"
import { CodeFlowNode } from "./_components/node-cf-components/CodeFlowNode"
import { EndFlowNode } from "./_components/node-cf-components/EndFlowNode"
import { NoteFlowNode } from "./_components/node-cf-components/NoteFlowNode"
import { Suspense, useEffect, useState } from "react"
import type { CF } from "./_types/global-cf-types"
import { conversational_flow_session_storage } from "./_lib/flow-sessionStorage"
import { createFunctionTool, type AvailableToolType } from "../agents/_components/functions/general-tools-editor"
import { getGeneralTools, writeGeneralTools } from "../agents/_lib/session-storage/agent-session"
import { FlowTertiaryPanel } from "./_components/panels/flow-tertiary-panel"
import { SubflowStartNode } from "./_components/node-cf-components/SubflowStartNode"
import { SubflowEndNode } from "./_components/node-cf-components/SubflowEndNode"
import { SubFlowCustomNode } from "./_components/node-cf-components/SubFlowCustomNode"
import { flowHelperDeleteFlowNode, flowHelperGetFlowNodesFromSessionStorage, flowHelperSaveFlowNode, flowHelperUpdateFlowNode } from "./_lib/flow-subflow-helper-functions"
import { subflow_session_storage } from "./_lib/flow-subflow-sessonStorage"
import { FlowTopNavbarPanel } from "./_components/panels/flow-top-navbar-panel"
import { useSessionStorageInitAgentSession } from "../agents/_components/main/agent-session-main"
import { FlowRightSidePanel } from "./_components/panels/flow-right-side-panel"


type FlowNode = CF["Node"]

const nodeTypes = {
    note: NoteFlowNode,
    begin: FlowBeginNodeType,
    conversation: FlowConversationNodeType,
    subagent: FlowSubAgentsNodeType,
    transfer_call: CallTransferFlowNode,
    press_digit: PressDigitFlowNode,
    branch: LogicSplitFlowNode,
    agent_swap: AgentTransferFlowNode,
    sms: SmsFlowNode,
    code: CodeFlowNode,
    function: CustomFunctionFlowNode,
    end: EndFlowNode,
    subflow_start: SubflowStartNode,
    subflow_end: SubflowEndNode,
    subflow: SubFlowCustomNode,
}

function getEdges(data: CF["Node"]["data"]): CF["Edge"][] {
    return [
        ...("edges" in data ? data.edges ?? [] : []),
        ...("edge" in data ? [data.edge] : []),
        ...("else_edge" in data && data.else_edge ? [data.else_edge] : []),
        ...("always_edge" in data && data.always_edge ? [data.always_edge] : []),
        ...("success_edge" in data ? [data.success_edge] : []),
        ...("failed_edge" in data ? [data.failed_edge] : []),
    ]
}

function setDestination(
    node: CF["Node"],
    edgeId: string,
    destination_node_id: string
): CF["Node"] {
    const update = (edge: CF["Edge"]) => edge.id === edgeId ? { ...edge, destination_node_id } : edge
    const data = node.data
    return {
        ...node,
        data: {
            ...data,
            ...("edges" in data && { edges: data.edges?.map(update) }),
            ...("edge" in data && { edge: update(data.edge) }),
            ...("else_edge" in data && data.else_edge ? { else_edge: update(data.else_edge) } : {}),
            ...("always_edge" in data && data.always_edge ? { always_edge: update(data.always_edge) } : {}),
            ...("success_edge" in data && { success_edge: update(data.success_edge) }),
            ...("failed_edge" in data && { failed_edge: update(data.failed_edge) }),
        },
    } as CF["Node"]

}

function FlowCanvas() {

    const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(flowHelperGetFlowNodesFromSessionStorage())
    const [edges, setEdges] = useState<Edge[]>([])
    const [cusrorInteractionMode, setCursorInteractionMode] = useState<"select" | "pan">("pan")
    const { screenToFlowPosition } = useReactFlow()

    // update edges
    useEffect(() => {
        const timeout = setTimeout(() => {
            setEdges(nodes.flatMap(node => getEdges(node.data).filter(edge => edge.destination_node_id).map(edge => ({ id: edge.id, source: node.id, sourceHandle: edge.id, target: edge.destination_node_id!, type: "smoothstep", }))))
        }, 150)
        return () => clearTimeout(timeout)
    }, [nodes])


    function onDrop(e: React.DragEvent) {
        e.preventDefault()

        const nodeType = e.dataTransfer.getData("application/reactflow") as CF["Type"]
        if (!nodeType) return

        const referencedSubflowId = nodeType === "subflow" ? e.dataTransfer.getData("application/subflow-id") : undefined

        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })

        const nodeData = createCFNode(nodeType, position, referencedSubflowId)

        // Save node to session storage
        flowHelperSaveFlowNode(nodeData)

        // Sync corresponding tool with agent session storage
        updateAgentSessionStorageOnDropCanvas(nodeType)

        setNodes(nodes => [...nodes, { id: nodeData.id, type: nodeData.type, position, data: nodeData } as CF["Node"],])
    }


    function onConnect({ source, sourceHandle, target }: Connection) {
        if (!source || !sourceHandle || !target) return

        const sourceNode = nodes.find(node => node.id === source)
        if (!sourceNode) return

        const data = flowHelperGetFlowNodesFromSessionStorage().find(node => node.id === source)?.data ?? sourceNode.data
        const updatedNode = setDestination({ ...sourceNode, data } as CF["Node"], sourceHandle, target)

        flowHelperUpdateFlowNode(updatedNode.data)

        setNodes(current => current.map(node => node.id === source ? updatedNode : node))
    }

    // useEffect(() => {
    //     console.log("Main Flow Nodes:", conversational_flow_session_storage.getAll())
    //     console.log("Subflow Components:", subflow_session_storage.getAll())
    //     console.log("Current Canvas Nodes:", nodes)
    // }, [nodes])

    return (
        <div className="size-full">
            <Suspense fallback={null}>
                <FlowTopNavbarPanel />
                <FlowLeftSidePanel />
                <FlowRightSidePanel />
                <FlowTertiaryPanel />
            </Suspense>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onConnect={onConnect}
                panOnDrag={cusrorInteractionMode === "pan" ? true : [1, 2]}
                selectionOnDrag={cusrorInteractionMode === "select"}
                onNodesDelete={(nodes) => { nodes.forEach(node => updateAgentSessionStorageOnDeleteCanvas(node.type, node.id)) }}
                onDrop={onDrop}
                onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = "move"
                }}
                fitView
                className="bg-zinc-950"
            >
                <Background variant={BackgroundVariant.Dots} color="#52525b" gap={22} size={1.25} />
                <FlowBottomToolbar interactionMode={cusrorInteractionMode} onInteractionModeChange={setCursorInteractionMode} />
            </ReactFlow>
        </div>
    )
}

export default function ConversationalFlowPage() {

    // resolve sessionStorage
    const { isSessionLoading } = useSessionStorageInitAgentSession()
    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true); }, [])

    // so we dont start from fresh template onPage reload
    useEffect(() => {
        if (!mounted || isSessionLoading) return
        removeTemplateFromUrl()
    }, [mounted, isSessionLoading])

    // so we dont start from fresh template onPage reload
    function removeTemplateFromUrl() {
        const params = new URLSearchParams(window.location.search)
        if (!params.has("template")) return

        params.delete("template")
        window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`)
    }

    if (!mounted || isSessionLoading) return <div className="absolute inset-0 z-50 bg-background"><Loading /></div>

    return (
        <main className="min-h-svh bg-zinc-950">
            <section className="h-screen w-full">
                <ReactFlowProvider>
                    <FlowCanvas />
                </ReactFlowProvider>
            </section>
        </main>
    )
}

function updateAgentSessionStorageOnDropCanvas(type: CF["Type"]) {
    const toolMap: Partial<Record<CF["Type"], AvailableToolType>> = {
        function: "custom",
        transfer_call: "transfer_call",
        press_digit: "press_digit",
        sms: "send_sms",
        code: "code",
        end: "end_call",
    }

    const toolType = toolMap[type]
    if (!toolType) return

    writeGeneralTools([
        ...getGeneralTools(),
        createFunctionTool(toolType),
    ])
}

function updateAgentSessionStorageOnDeleteCanvas(type: CF["Type"], id: string) {
    const toolMap: Partial<Record<CF["Type"], AvailableToolType>> = {
        transfer_call: "transfer_call",
        press_digit: "press_digit",
        sms: "send_sms",
        code: "code",
        end: "end_call",
    }

    flowHelperDeleteFlowNode(id)

    const toolType = toolMap[type]
    if (!toolType) return

    writeGeneralTools(
        getGeneralTools().filter(tool => tool.type !== toolType)
    )

}



function FlowBottomToolbar({ interactionMode, onInteractionModeChange }: { interactionMode: "select" | "pan", onInteractionModeChange: (mode: "select" | "pan") => void }) {
    const [showMiniMap, setShowMiniMap] = useState(true)
    const { zoomIn, zoomOut } = useReactFlow<FlowNode>()
    const { zoom } = useViewport()

    const controls = [
        { label: "Select nodes", icon: MousePointer2, active: interactionMode === "select", onClick: () => onInteractionModeChange("select") },
        { label: "Drag canvas", icon: Hand, active: interactionMode === "pan", onClick: () => onInteractionModeChange("pan") },
        { label: "Show minimap", icon: MapIcon, active: showMiniMap, onClick: () => setShowMiniMap(show => !show) },
    ]

    return (
        <>
            {showMiniMap && <MiniMap className="border border-border/40 rounded-2xl overflow-hidden" style={{ bottom: 64 }} position="bottom-center" pannable zoomable bgColor="#18181b" nodeColor="#71717a" maskColor="rgba(0, 0, 0, 0.5)" />}
            <Panel position="bottom-center" className="flex items-center gap-1 rounded-2xl border border-border bg-zinc-900 p-2 text-zinc-300 shadow-lg" role="toolbar" aria-label="Flow canvas controls">
                {controls.map(({ label, icon: Icon, active, onClick }) => (
                    <Button key={label} type="button" variant="ghost" size="icon-lg" title={label} aria-label={label} aria-pressed={active} onClick={onClick} className={active ? "bg-zinc-700 text-white" : ""}>
                        <Icon />
                    </Button>
                ))}
                <span className="mx-1 h-6 w-px bg-border" />
                <Button type="button" variant="ghost" size="icon-lg" title="Zoom out" aria-label="Zoom out" onClick={() => { void zoomOut({ duration: 200 }) }}><Minus /></Button>
                <span className="min-w-12 text-center text-sm tabular-nums" aria-live="polite">{Math.round(zoom * 100)}%</span>
                <Button type="button" variant="ghost" size="icon-lg" title="Zoom in" aria-label="Zoom in" onClick={() => { void zoomIn({ duration: 200 }) }}><Plus /></Button>
            </Panel>
        </>
    )
}

import { useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { ArrowRight, Equal, Plus, Settings2, Sigma, Trash2 } from "lucide-react"

import type { CF, EquationOperator, TransitionCondition } from "../../_types/global-cf-types"
import { EdgeRow } from "./FlowNodePrimitives"

type TransitionNode = (
    | CF["Data"]["conversation"]
    | CF["Data"]["subagent"]
    | CF["Data"]["press_digit"]
    | CF["Data"]["branch"]
    | CF["Data"]["code"]
) & {
    edges?: CF["Edge"][]
    else_edge?: CF["Edge"]
    always_edge?: CF["Edge"]
}
type EquationCondition = Extract<TransitionCondition, { type: "equation" }>
type Color = "pink" | "green" | "cyan" | "blue" | "zinc"
type TransitionType = "prompt" | "equation" | "else" | "always"

const comparisonOperators: EquationOperator[] = ["==", "!=", ">", ">=", "<", "<="]

function getConditionLabel(condition: TransitionCondition) {
    if (condition.type === "prompt") return condition.prompt || "Describe the transition condition"
    if (!condition.equations.length) return "Set a condition"
    return condition.equations
        .map(({ left, operator, right }) => `${left || "…"} ${operator} ${right || "…"}`)
        .join(` ${condition.operator} `)
}

export function TransitionEditor<T extends TransitionNode>({
    node,
    onUpdate,
    color,
    excludedTransitionTypes = [],
}: {
    node: T
    onUpdate: (update: (node: T) => T) => void
    color: Color
    excludedTransitionTypes?: TransitionType[]
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [equationEdge, setEquationEdge] = useState<{ id: string; isNew: boolean; condition: EquationCondition } | null>(null)
    const [alwaysEdge, setAlwaysEdge] = useState<{ id?: string; skippable: boolean } | null>(null)
    const textColor = {
        pink: "text-pink-400",
        green: "text-green-400",
        cyan: "text-cyan-400",
        blue: "text-blue-400",
        zinc: "text-zinc-400",
    }[color]

    const updateEdges = (update: (edges: CF["Edge"][]) => CF["Edge"][]) =>
        onUpdate(current => ({ ...current, edges: update(current.edges ?? []) }))
    const deleteEdge = (id: string) => updateEdges(edges => edges.filter(edge => edge.id !== id))

    function addPrompt() {
        onUpdate(current => ({
            ...current,
            always_edge: undefined,
            edges: [...(current.edges ?? []), {
                id: crypto.randomUUID(),
                transition_condition: { type: "prompt", prompt: "Describe the transition condition" },
            }],
        }))
        setIsMenuOpen(false)
    }

    function addEquation() {
        const id = crypto.randomUUID()
        const condition: EquationCondition = { type: "equation", operator: "&&", equations: [] }
        onUpdate(current => ({
            ...current,
            always_edge: undefined,
            edges: [...(current.edges ?? []), { id, transition_condition: condition }],
        }))
        setEquationEdge({ id, isNew: true, condition })
        setIsMenuOpen(false)
    }

    function addElse() {
        onUpdate(current => ({
            ...current,
            always_edge: undefined,
            else_edge: { id: crypto.randomUUID(), transition_condition: { type: "prompt", prompt: "Else" } },
        }))
        setIsMenuOpen(false)
    }

    function saveEquation(condition: EquationCondition) {
        if (!equationEdge) return
        updateEdges(edges => edges.map(edge =>
            edge.id === equationEdge.id ? { ...edge, transition_condition: condition } : edge
        ))
        setEquationEdge(null)
    }

    function cancelEquation() {
        if (equationEdge?.isNew) deleteEdge(equationEdge.id)
        setEquationEdge(null)
    }

    function saveAlways(skippable: boolean) {
        onUpdate(current => ({
            ...current,
            skippable,
            edges: [],
            else_edge: undefined,
            always_edge: {
                id: alwaysEdge?.id ?? crypto.randomUUID(),
                transition_condition: { type: "prompt", prompt: "Always" },
            },
        }))
        setAlwaysEdge(null)
    }

    return <>
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
            <span className={`text-sm font-medium ${textColor}`}>Transition</span>
            <div className="nodrag relative">
                <button type="button" onClick={() => setIsMenuOpen(open => !open)} aria-label="Add transition" className="text-zinc-400 hover:text-white">
                    <Plus className="size-4" />
                </button>
                {isMenuOpen && <TransitionMenu excludedTransitionTypes={excludedTransitionTypes} onPrompt={addPrompt} onEquation={addEquation} onElse={addElse} onAlways={() => {
                    setAlwaysEdge({ skippable: node.skippable })
                    setIsMenuOpen(false)
                }} />}
            </div>
        </div>

        {(node.edges ?? []).map(edge => {
            const isPrompt = edge.transition_condition.type === "prompt"
            const condition = edge.transition_condition as EquationCondition
            return <EdgeRow
                key={edge.id}
                edge={edge}
                color={color}
                label={getConditionLabel(edge.transition_condition)}
                onLabelChange={isPrompt ? prompt => updateEdges(edges => edges.map(item =>
                    item.id === edge.id
                        ? { ...item, transition_condition: { type: "prompt", prompt } }
                        : item
                )) : undefined}
                onClick={!isPrompt ? () => setEquationEdge({ id: edge.id, isNew: false, condition }) : undefined}
                actions={<div className="flex items-center gap-1">
                    {!isPrompt && <button type="button" onClick={() => setEquationEdge({ id: edge.id, isNew: false, condition })} aria-label="Configure equation" className="text-zinc-500 hover:text-zinc-200">
                        <Settings2 className="size-3.5" />
                    </button>}
                    <DeleteButton label="Delete transition" onClick={() => deleteEdge(edge.id)} />
                </div>}
            />
        })}

        {node.else_edge && <EdgeRow
            edge={node.else_edge}
            color={color}
            label="Else"
            actions={<DeleteButton label="Delete else transition" onClick={() => onUpdate(current => ({ ...current, else_edge: undefined }))} />}
        />}
        {!excludedTransitionTypes.includes("always") && node.always_edge && <EdgeRow
            edge={node.always_edge}
            color={color}
            label={node.skippable ? "Skip User Response" : "After User Responds"}
            onClick={() => setAlwaysEdge({ id: node.always_edge!.id, skippable: node.skippable })}
            actions={<DeleteButton label="Delete always transition" onClick={() => onUpdate(current => ({ ...current, always_edge: undefined }))} />}
        />}

        {equationEdge && <EquationModal initial={equationEdge.condition} onSave={saveEquation} onCancel={cancelEquation} />}
        {alwaysEdge && <AlwaysModal initialSkippable={alwaysEdge.skippable} onSave={saveAlways} onCancel={() => setAlwaysEdge(null)} />}
    </>
}

function TransitionMenu({ excludedTransitionTypes, onPrompt, onEquation, onElse, onAlways }: {
    excludedTransitionTypes: TransitionType[]
    onPrompt: () => void
    onEquation: () => void
    onElse: () => void
    onAlways: () => void
}) {
    const transitionItems: Array<{ type: TransitionType; label: string; icon: ReactNode; action: () => void }> = [
        { type: "prompt", label: "Prompt", icon: <Equal className="size-4" />, action: onPrompt },
        { type: "equation", label: "Equation", icon: <Sigma className="size-4" />, action: onEquation },
        { type: "else", label: "Else", icon: <ArrowRight className="size-4" />, action: onElse },
        { type: "always", label: "Always/Skip", icon: <ArrowRight className="size-4" />, action: onAlways },
    ]
    const items = transitionItems.filter(item => !excludedTransitionTypes.includes(item.type))

    return <div className="absolute right-0 top-7 z-20 w-48 overflow-hidden rounded-xl border border-zinc-700 bg-[#202025] py-1 shadow-2xl">
        {items.map((item, index) => <div key={item.label}>
            {index === 2 && <div className="my-1 border-t border-zinc-700" />}
            <button type="button" onClick={item.action} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-700">
                {item.icon}
                {item.label}
            </button>
        </div>)}
    </div>
}

function EquationModal({ initial, onSave, onCancel }: {
    initial: EquationCondition
    onSave: (condition: EquationCondition) => void
    onCancel: () => void
}) {
    const [condition, setCondition] = useState(initial)
    const updateClause = (index: number, update: Partial<EquationCondition["equations"][number]>) =>
        setCondition(current => ({
            ...current,
            equations: current.equations.map((clause, clauseIndex) =>
                clauseIndex === index ? { ...clause, ...update } : clause
            ),
        }))

    return <Modal>
        <section className="w-[440px] rounded-2xl border border-zinc-700 bg-[#202025] p-5 shadow-2xl">
            <ModalHeader title="Configure conditions" onClose={onCancel} />
            <div className="mb-4 flex items-center gap-2 text-sm text-zinc-300">
                <select value={condition.operator} onChange={event => setCondition(current => ({ ...current, operator: event.target.value as "&&" | "||" }))} className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5">
                    <option value="||">Any</option>
                    <option value="&&">All</option>
                </select>
                <span>of the following conditions match</span>
            </div>
            <div className="space-y-2">
                {condition.equations.map((clause, index) => <div key={index} className="flex gap-2">
                    <input value={clause.left} onChange={event => updateClause(index, { left: event.target.value })} placeholder="Variable" className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm" />
                    <select value={clause.operator} onChange={event => updateClause(index, { operator: event.target.value as EquationOperator })} className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5">
                        {comparisonOperators.map(operator => <option key={operator}>{operator}</option>)}
                    </select>
                    <input value={clause.right} onChange={event => updateClause(index, { right: event.target.value })} placeholder="Value" className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm" />
                    <DeleteButton label="Delete condition" onClick={() => setCondition(current => ({ ...current, equations: current.equations.filter((_, clauseIndex) => clauseIndex !== index) }))} />
                </div>)}
            </div>
            <button type="button" onClick={() => setCondition(current => ({
                ...current,
                equations: [...current.equations, { left: "", operator: "==", right: "" }],
            }))} className="mt-4 text-sm text-zinc-300 hover:text-white">
                + Add Condition
            </button>
            <ModalActions onCancel={onCancel} onSave={() => onSave(condition)} />
        </section>
    </Modal>
}

function AlwaysModal({ initialSkippable, onSave, onCancel }: {
    initialSkippable: boolean
    onSave: (skippable: boolean) => void
    onCancel: () => void
}) {
    const [skippable, setSkippable] = useState(initialSkippable)
    return <Modal>
        <section className="w-[400px] rounded-2xl border border-zinc-700 bg-[#202025] p-5 shadow-2xl">
            <ModalHeader title="Always Transition" onClose={onCancel} />
            <h3 className="text-sm font-medium text-zinc-200">Transition Mode</h3>
            <p className="mt-2 text-sm text-zinc-400">Determine if the node transitions after or skips user response</p>
            <label className="mt-4 flex items-center gap-2 text-sm text-zinc-200">
                <input type="radio" checked={!skippable} onChange={() => setSkippable(false)} />
                After User Responds
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm text-zinc-200">
                <input type="radio" checked={skippable} onChange={() => setSkippable(true)} />
                Skip User Response
            </label>
            <ModalActions onCancel={onCancel} onSave={() => onSave(skippable)} />
        </section>
    </Modal>
}

function Modal({ children }: { children: ReactNode }) {
    return createPortal(
        <div className="nodrag nowheel fixed inset-0 z-50 flex items-center justify-center bg-black/40">{children}</div>,
        document.body
    )
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
    return <header className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
        <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white">×</button>
    </header>
}

function ModalActions({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
    return <footer className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm">Cancel</button>
        <button type="button" onClick={onSave} className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-zinc-900">Save</button>
    </footer>
}

function DeleteButton({ label, onClick }: { label: string; onClick: () => void }) {
    return <button type="button" onClick={onClick} aria-label={label} className="text-red-500 hover:text-red-300">
        <Trash2 className="size-3.5" />
    </button>
}

"use client"

import { useState } from "react"
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { accounts_switchAccount } from "../_lib/accounts-switch-functions"
import type { accounts_getAccounts } from "../_lib/accounts-switch-functions"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

const PAGE_SIZE = 10

export function AccountsSwitchClient({ accounts }: { accounts: Awaited<ReturnType<typeof accounts_getAccounts>> }) {
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)

    const query = search.trim().toLowerCase()
    const filteredAccounts = accounts.filter((account) => `${account.name} ${account.email} ${account.workspace}`.toLowerCase().includes(query))

    const pageCount = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE))
    const currentPage = Math.min(page, pageCount)
    const start = (currentPage - 1) * PAGE_SIZE
    const visibleAccounts = filteredAccounts.slice(start, start + PAGE_SIZE)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Switch account</CardTitle>
                <CardDescription>
                    Select an account to sign in as that user. Switching clears unsaved editor drafts.
                    To return, sign out and log in with Google again. Refresh other open tabs after switching.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Badge variant="secondary">{filteredAccounts.length} accounts</Badge>
                    <div className="relative w-full sm:max-w-sm">
                        <SearchIcon className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" aria-hidden="true" />
                        <Input aria-label="Search accounts" placeholder="Search name, email, or workspace…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} className="pl-9" />
                    </div>
                </div>
                <Table aria-label="Accounts">
                    <TableHeader className="border-b bg-muted/30 text-muted-foreground">
                        <TableRow>
                            <TableHead scope="col" className="px-4 py-3 font-medium">Account</TableHead>
                            <TableHead scope="col" className="px-4 py-3 font-medium">Workspace</TableHead>
                            <TableHead scope="col" className="px-4 py-3 font-medium">Role</TableHead>
                            <TableHead scope="col" className="px-4 py-3 text-right font-medium">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {visibleAccounts.map((account) => (
                            <TableRow key={account.id} className="border-b last:border-0 hover:bg-muted/20">
                                <TableCell className="px-4 py-4">
                                    <p className="font-medium">{account.name}</p>
                                </TableCell>
                                <TableCell className="whitespace-nowrap px-4 py-4">{account.workspace}</TableCell>
                                <TableCell className="px-4 py-4"><Badge variant="secondary">{account.role}</Badge></TableCell>
                                <TableCell className="px-4 py-4 text-right">
                                    <SwitchAccountButton id={account.id} name={account.name} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredAccounts.length === 0 && (
                            <TableRow><TableCell colSpan={4} className="px-4 py-12 text-center text-muted-foreground">No accounts found. Try another name, email, or workspace.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="flex-wrap justify-between gap-3">
                <p className="text-sm text-muted-foreground" role="status">
                    {filteredAccounts.length ? start + 1 : 0}–{Math.min(start + PAGE_SIZE, filteredAccounts.length)} of {filteredAccounts.length} accounts
                </p>
                <nav aria-label="Account pagination" className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                        <ChevronLeftIcon aria-hidden="true" /> Previous
                    </Button>
                    <span className="text-sm">Page {currentPage} of {pageCount}</span>
                    <Button variant="outline" size="sm" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>
                        Next <ChevronRightIcon aria-hidden="true" />
                    </Button>
                </nav>
            </CardFooter>
        </Card>
    )
}


function SwitchAccountButton({ id, name }: { id: number; name: string }) {
    const [isSwitching, setIsSwitching] = useState(false)
    const [error, setError] = useState("")

    async function handleSwitch() {
        if (isSwitching) return

        setIsSwitching(true)
        setError("")

        try {
            await accounts_switchAccount(id)

            for (const key of ["agent-session", "agent-session:fresh", "agent-session:stale", "flow-node-data",]) {
                sessionStorage.removeItem(key)
            }

            window.location.assign("/dashboard/agents")
        } catch {
            setError("Could not switch accounts. Please try again.")
            setIsSwitching(false)
        }
    }

    return (
        <div>
            <Button
                variant="outline"
                disabled={isSwitching}
                onClick={handleSwitch}
                aria-label={`Switch to ${name}`}
            >
                {isSwitching ? "Switching…" : "Switch account"}
                <ArrowRightIcon aria-hidden="true" />
            </Button>

            {error && (<p role="alert" className="mt-1 text-sm text-destructive">{error}</p>)}
        </div>
    )
}
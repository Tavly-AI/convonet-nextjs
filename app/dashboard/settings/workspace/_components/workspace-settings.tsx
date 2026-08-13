"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  addWorkspaceMember,
  deleteWorkspace,
  removeWorkspaceMember,
  updateMemberRole,
  updateWorkspaceName,
} from "../actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  EllipsisIcon,
  HexagonIcon,
  PlusIcon,
  UserCogIcon,
  UsersIcon,
} from "lucide-react"
import { WORKSPACE_ROLES, WorkspaceRole } from "@/lib/enums/roles"

type WorkspaceSettingsProps = {
  workspace: {
    id: string
    name: string
    users: {
      id: number
      email: string | null
      role: string | null
    }[]
  }
  currentUserId: number
}

const roleEntries = Object.entries(WORKSPACE_ROLES) as [
  WorkspaceRole,
  (typeof WORKSPACE_ROLES)[WorkspaceRole],
][]

export function WorkspaceSettings({
  workspace,
  currentUserId,
}: WorkspaceSettingsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(workspace.name)
  const [email, setEmail] = useState("")
  const [inviteRole, setInviteRole] = useState(WorkspaceRole.MEMBER)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  function runAction(action: () => Promise<void>, successMessage: string) {
    startTransition(async () => {
      try {
        await action()
        toast.success(successMessage)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Something went wrong.")
      }
    })
  }

  return (
    <Tabs
      defaultValue="general"
      orientation="vertical"
      className="min-h-[calc(100svh-var(--header-height)-2rem)] flex-col gap-3 md:flex-row"
    >
      <aside className="shrink-0 rounded-xl bg-card ring-1 ring-foreground/10 md:w-56">
        <div className="px-4 pt-4 text-xs font-medium text-muted-foreground">
          Workspace
        </div>
        <TabsList className="w-full items-stretch justify-start gap-3 bg-transparent p-3 max-md:flex-row! max-md:overflow-x-auto md:flex-col">
          <TabsTrigger value="general" className="max-md:w-auto! md:w-full">
            <HexagonIcon />
            General
          </TabsTrigger>
          <TabsTrigger value="users" className="max-md:w-auto! md:w-full">
            <UsersIcon />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="max-md:w-auto! md:w-full">
            <UserCogIcon />
            Roles
          </TabsTrigger>
        </TabsList>
      </aside>

      <section className="min-w-0 flex-1 rounded-xl bg-card p-4 ring-1 ring-foreground/10 md:p-5">
        <TabsContent value="general" className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-medium">General</h1>
            <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                  <EllipsisIcon />
                  <span className="sr-only">Workspace actions</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <SheetTrigger render={<DropdownMenuItem variant="destructive" />}>
                    Delete workspace
                  </SheetTrigger>
                </DropdownMenuContent>
              </DropdownMenu>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Delete workspace</SheetTitle>
                  <SheetDescription>
                    This removes the workspace and disconnects every member.
                  </SheetDescription>
                </SheetHeader>
                <SheetFooter>
                  <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
                  <Button
                    variant="destructive"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        try {
                          await deleteWorkspace()
                          router.replace("/dashboard")
                        } catch (error) {
                          toast.error(
                            error instanceof Error ? error.message : "Could not delete workspace."
                          )
                        }
                      })
                    }
                  >
                    Delete workspace
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          <form
            className="grid max-w-2xl gap-5"
            onSubmit={(event) => {
              event.preventDefault()
              runAction(() => updateWorkspaceName(name), "Workspace updated.")
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-describedby="workspace-id"
                required
              />
            </div>
            <div className="grid gap-1">
              <Label>Workspace ID</Label>
              <p id="workspace-id" className="text-sm text-muted-foreground">
                {workspace.id}
              </p>
            </div>
            <Button type="submit" className="w-fit" disabled={isPending || name === workspace.name}>
              Save
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="users" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-medium">Users</h1>
            <Sheet open={inviteOpen} onOpenChange={setInviteOpen}>
              <SheetTrigger render={<Button type="button" variant="outline" />}>
                <PlusIcon />
                Invite member
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Invite member</SheetTitle>
                  <SheetDescription>
                    Add an existing account to this workspace.
                  </SheetDescription>
                </SheetHeader>
                <form
                  className="grid gap-4 px-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    startTransition(async () => {
                      try {
                        await addWorkspaceMember(email, inviteRole)
                        setEmail("")
                        setInviteOpen(false)
                        toast.success("Member added.")
                      } catch (error) {
                        // note: add send mail function later
                        toast.error(error instanceof Error ? error.message : "Could not add member.")
                      }
                    })
                  }}
                >
                  <div className="grid gap-2">
                    <Label htmlFor="member-email">Email</Label>
                    <Input
                      id="member-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@company.com"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Role</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {roleEntries.map(([value, role]) => (
                        <Button
                          key={value}
                          type="button"
                          variant={inviteRole === value ? "secondary" : "outline"}
                          onClick={() => setInviteRole(value)}
                        >
                          {role.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" disabled={isPending}>Add member</Button>
                </form>
              </SheetContent>
            </Sheet>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspace.users.map((member) => {
                  const role = WORKSPACE_ROLES[member.role as WorkspaceRole]
                  const isCurrentUser = member.id === currentUserId

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{member.email ?? "No email"}</span>
                          {isCurrentUser && <Badge variant="secondary">You</Badge>}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{role?.label ?? "Member"}</Badge></TableCell>
                      <TableCell>
                        {!isCurrentUser && (
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                              <EllipsisIcon />
                              <span className="sr-only">Member actions</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {roleEntries.map(([value, item]) => (
                                <DropdownMenuItem
                                  key={value}
                                  disabled={member.role === value || isPending}
                                  onClick={() => runAction(
                                    () => updateMemberRole(member.id, value),
                                    "Member role updated."
                                  )}
                                >
                                  Set as {item.label}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuItem
                                variant="destructive"
                                disabled={isPending}
                                onClick={() => runAction(
                                  () => removeWorkspaceMember(member.id),
                                  "Member removed."
                                )}
                              >
                                Remove member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="roles" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-medium">Roles</h1>
            <Button type="button" variant="outline" disabled><PlusIcon />Add role</Button>
          </div>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleEntries.map(([value, role]) => (
                  <TableRow key={value}>
                    <TableCell className="font-medium">{role.label}</TableCell>
                    <TableCell className="min-w-96 whitespace-normal text-muted-foreground">
                      {role.description}
                    </TableCell>
                    <TableCell>{role.type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </section>
    </Tabs>
  )
}

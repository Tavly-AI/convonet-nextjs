"use client"

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

const roles = [
  {
    role: "Admin",
    description:
      "Full control over workspace resources and members, including billing, user management, and organization settings.",
    type: "System",
  },
  {
    role: "Developer",
    description:
      "Build and test agents, view raw data, and manage analytics and settings. Cannot manage billing or workspace members.",
    type: "System",
  },
  {
    role: "Member",
    description:
      "Read-only access to agents, testing, scrubbed history, analytics, and phone numbers.",
    type: "System",
  },
]

export function WorkspaceSettings() {
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
          <TabsTrigger
            value="general"
            className="max-md:w-auto! md:w-full"
          >
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
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="icon" />}
              >
                <EllipsisIcon />
                <span className="sr-only">Workspace actions</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem variant="destructive">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid max-w-2xl gap-5">
            <div className="grid gap-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                defaultValue="My Workspace"
                aria-describedby="workspace-id"
              />
            </div>

            <div className="grid gap-1">
              <Label>Workspace ID</Label>
              <p id="workspace-id" className="text-sm text-muted-foreground">
                org_3YadqM8Bczai2GBo
              </p>
            </div>

            <Button type="button" className="w-fit">
              Save
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="users" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-medium">Users</h1>
            <Button type="button" variant="outline">
              <PlusIcon />
              Invite member
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>you@company.com</span>
                      <Badge variant="secondary">You</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">Admin</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" />
                        }
                      >
                        <EllipsisIcon />
                        <span className="sr-only">User actions</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Change role</DropdownMenuItem>
                        <DropdownMenuItem variant="destructive">
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="roles" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-medium">Roles</h1>
            <Button type="button" variant="outline" disabled>
              <PlusIcon />
              Add role
            </Button>
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
                {roles.map((role) => (
                  <TableRow key={role.role}>
                    <TableCell className="font-medium">{role.role}</TableCell>
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

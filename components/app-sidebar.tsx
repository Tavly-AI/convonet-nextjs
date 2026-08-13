"use client"

import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  BotIcon,
  BookOpenIcon,
  PhoneIcon,
  UsersIcon,
  HistoryIcon,
  MessageCircleIcon,
  UserIcon,
  CircleHelpIcon,
  CommandIcon,
  Settings2Icon,
  SearchIcon,
  CameraIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  WorkflowIcon,
  ReceiptTextIcon,
} from "lucide-react"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },

  navMain: [
    {
      title: "Home",
      url: "#",
      icon: (
        <LayoutDashboardIcon
        />
      ),
    },
  ],

  navClouds: [
    {
      title: "Capture",
      icon: (
        <CameraIcon
        />
      ),
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: (
        <FileTextIcon
        />
      ),
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: (
        <FileTextIcon
        />
      ),
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Get Help",
      url: "#",
      icon: (
        <CircleHelpIcon
        />
      ),
    },
    {
      title: "Search",
      url: "#",
      icon: (
        <SearchIcon
        />
      ),
    },
  ],

  build: [
    {
      name: "Agents",
      url: "#",
      icon: <BotIcon />,
    },
    {
      name: "Knowledge Base",
      url: "#",
      icon: <BookOpenIcon />,
    },
  ],
  deploy: [
    {
      name: "Phone Numbers",
      url: "#",
      icon: <PhoneIcon />,
    },
    {
      name: "Batch Call",
      url: "#",
      icon: <UsersIcon />,
    },
  ],
  data: [
    {
      name: "Call History",
      url: "#",
      icon: <HistoryIcon />,
    },
    {
      name: "Chat History",
      url: "#",
      icon: <MessageCircleIcon />,
    },
    {
      name: "Contacts",
      url: "#",
      icon: <UserIcon />,
    },
  ],
  system: [
    {
      name: "Integrations",
      url: "#",
      icon: <WorkflowIcon />,
    },
    {
      name: "Billing",
      url: "#",
      icon: <ReceiptTextIcon />,
    },
    {
      name: "Settings",
      url: "#",
      icon: <Settings2Icon />,
    },
  ],
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <CommandIcon className="size-5!" />
              <span className="text-base font-semibold">Tavly AI</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />

        <NavDocuments title="BUILD" items={data.build} />
        <NavDocuments title="DEPLOY" items={data.deploy} />
        <NavDocuments title="DATA" items={data.data} />
        <NavDocuments title="SYSTEM" items={data.system} />

        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}

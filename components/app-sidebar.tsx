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
  Settings2Icon,
  SearchIcon,
  CameraIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  WorkflowIcon,
  ReceiptTextIcon,
  RulerIcon,
  ShieldCheckIcon,
  KeyRoundIcon,
  BoxIcon,
} from "lucide-react"
import { COMPANY_LOGO, COMPANY_NAME } from "@/lib/constants"
import { usePathname } from "next/navigation"

const data1 = {
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
      url: "/dashboard/settings",
      icon: <Settings2Icon />,
    },
  ],
}

const data2 = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  goBack: [
    {
      name: "Limits",
      url: "/settings/limits",
      icon: <RulerIcon />,
    },
    {
      name: "Reliability",
      url: "/settings/reliability",
      icon: <ShieldCheckIcon />,
    },
    {
      name: "API Keys",
      url: "/settings/api-keys",
      icon: <KeyRoundIcon />,
    },
    {
      name: "Webhooks",
      url: "/settings/webhooks",
      icon: <BoxIcon />,
    },
    {
      name: "Workspace",
      url: "/dashboard/settings/workspace",
      icon: <UsersIcon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const isSettings = pathname.includes("/settings")

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <span
                className="[&_svg]:size-5"
                dangerouslySetInnerHTML={{ __html: COMPANY_LOGO }}
              />
              <span className="text-base font-semibold">{COMPANY_NAME}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data1.navMain} />

        {!isSettings && (
          <>
            <NavDocuments title="BUILD" items={data1.build} />
            <NavDocuments title="DEPLOY" items={data1.deploy} />
            <NavDocuments title="DATA" items={data1.data} />
            <NavDocuments title="SYSTEM" items={data1.system} />
          </>
        )}

        {isSettings && (
          <>
            <NavDocuments title="< GO BACK" items={data2.goBack} />
          </>
        )}
        <NavSecondary items={data1.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data1.user || data2.user} />
      </SidebarFooter>
    </Sidebar>
  )
}

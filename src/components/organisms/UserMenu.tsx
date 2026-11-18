"use client";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu } from "@/components/molecules/Overlays";
import { Avatar } from "@/components/atoms/Avatar";
import { Icon } from "@/components/atoms/Icon";
import { signOut } from "@/lib/actions/auth";

/** Account menu items shared by the sidebar footer and the top-bar avatar. */
export const accountItems = () => [
  { label: "Profile", href: "/account/profile", icon: <Icon name="user" /> },
  { label: "Security", href: "/account/security", icon: <Icon name="security" /> },
  { label: "Notifications", href: "/account/notifications", icon: <Icon name="bell" /> },
  { label: "My workspaces", href: "/account/workspaces", icon: <Icon name="workspaces" /> },
  { label: "Sign out", onSelect: () => void signOut(), icon: <Icon name="logout" />, separatorBefore: true },
];

/** Sidebar footer: avatar, name, role, account menu. */
export function UserMenu({ name, initials, role, collapsed }: { name: string; initials: string; role: string; collapsed?: boolean }) {
  return (
    <DropdownMenu
      align="start"
      items={accountItems()}
      trigger={
        <button type="button" aria-label="Account menu" className="flex w-full items-center gap-3 rounded-card p-2 text-left transition-colors hover:bg-surface data-[state=open]:bg-surface">
          <Avatar initials={initials} />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1"><span className="block truncate text-small text-fg">{name}</span><span className="block truncate text-micro text-fg-muted">{role}</span></span>
              <MoreHorizontal aria-hidden className="size-4 text-fg-muted" />
            </>
          )}
        </button>
      }
    />
  );
}

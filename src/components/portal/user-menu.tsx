"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { PORTAL_SIGN_IN_PATH } from "@/lib/constants/navigation";

interface UserMenuProps {
  name: string;
  email: string;
  roleLabel: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/** The signed-in user's name, role and the sign-out action. */
export function UserMenu({ name, email, roleLabel }: UserMenuProps) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push(PORTAL_SIGN_IN_PATH);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-3 px-2">
          <span className="sr-only">Open user menu</span>
          <Avatar>
            <AvatarFallback aria-hidden="true">{getInitials(name)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-semibold">{name}</span>
            <span className="block text-xs text-muted-foreground">{roleLabel}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-sm font-semibold">{name}</span>
          <span className="block text-xs text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void handleSignOut()}>
          <LogOutIcon aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

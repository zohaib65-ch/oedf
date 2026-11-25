"use client";

import { LogOutIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { PORTAL_PROFILE_LINK, PORTAL_SIGN_IN_PATH } from "@/lib/constants/navigation";

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

/** The signed-in user's name, role and the sign-out action, which asks for confirmation first. */
export function UserMenu({ name, email, roleLabel }: UserMenuProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      router.push(PORTAL_SIGN_IN_PATH);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <>
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
          <DropdownMenuItem asChild>
            <Link href={PORTAL_PROFILE_LINK.href}>
              <UserIcon aria-hidden="true" />
              {PORTAL_PROFILE_LINK.label}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setIsConfirming(true);
            }}
          >
            <LogOutIcon aria-hidden="true" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need your email and password to sign in to the staff portal again. Anything
              you have not saved will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSigningOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSigningOut}
              onClick={(event) => {
                // Keep the dialog open while signing out, so the button can show that it is working.
                event.preventDefault();
                void handleSignOut();
              }}
            >
              <LogOutIcon aria-hidden="true" />
              {isSigningOut ? "Signing out…" : "Sign out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

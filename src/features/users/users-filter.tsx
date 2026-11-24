import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_OPTIONS } from "@/lib/constants/labels";
import { ALL_ROLES } from "@/lib/validations/user";

interface UsersFilterProps {
  q: string | undefined;
  role: string | undefined;
}

/** A plain GET form: the filters live in the URL, so the list can be shared and bookmarked. */
export function UsersFilter({ q, role }: UsersFilterProps) {
  return (
    // The key remounts the fields when the URL changes (Clear, a shared link), so they never show old values.
    <form
      key={`${q ?? ""}|${role ?? ""}`}
      method="get"
      role="search"
      aria-label="Filter users"
      className="flex flex-wrap items-end gap-3"
    >
      <div className="space-y-1">
        <Label htmlFor="users-q">Search</Label>
        <Input
          id="users-q"
          name="q"
          defaultValue={q}
          placeholder="Name or email"
          className="w-64"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="users-role">Role</Label>
        <Select name="role" defaultValue={role ?? ALL_ROLES}>
          <SelectTrigger id="users-role" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ROLES}>All roles</SelectItem>
            {ROLE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit">Filter</Button>
      <Button asChild variant="ghost">
        <Link href="/portal/users">Clear</Link>
      </Button>
    </form>
  );
}

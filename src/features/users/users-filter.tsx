import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROLE_OPTIONS } from "@/lib/constants/labels";

interface UsersFilterProps {
  q: string | undefined;
  role: string | undefined;
}

/** A plain GET form: the filters live in the URL, so the list can be shared and bookmarked. */
export function UsersFilter({ q, role }: UsersFilterProps) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3"
      role="search"
      aria-label="Filter users"
    >
      <div className="space-y-1">
        <label htmlFor="users-q" className="block text-sm font-medium">
          Search
        </label>
        <Input
          id="users-q"
          name="q"
          defaultValue={q}
          placeholder="Name or email"
          className="w-64"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="users-role" className="block text-sm font-medium">
          Role
        </label>
        <select
          id="users-role"
          name="role"
          defaultValue={role ?? ""}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit">Filter</Button>
      <Button asChild variant="ghost">
        <Link href="/portal/users">Clear</Link>
      </Button>
    </form>
  );
}

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuditLogQuery } from "@/lib/validations/audit-log";

const fields = [
  { name: "entityType", label: "Record type", placeholder: "For example User" },
  { name: "action", label: "Action", placeholder: "For example user.created" },
] as const;

/** A plain GET form: the filters live in the URL. */
export function AuditLogFilter({ query }: { query: AuditLogQuery }) {
  return (
    <form
      method="get"
      role="search"
      aria-label="Filter the audit log"
      className="flex flex-wrap items-end gap-3"
    >
      {fields.map((field) => (
        <div key={field.name} className="space-y-1">
          <Label htmlFor={`audit-${field.name}`}>{field.label}</Label>
          <Input
            id={`audit-${field.name}`}
            name={field.name}
            defaultValue={query[field.name]}
            placeholder={field.placeholder}
            className="w-52"
          />
        </div>
      ))}
      {(["from", "to"] as const).map((name) => (
        <div key={name} className="space-y-1">
          <Label htmlFor={`audit-${name}`}>{name === "from" ? "From" : "To"}</Label>
          <Input id={`audit-${name}`} name={name} type="date" defaultValue={query[name]} />
        </div>
      ))}
      <Button type="submit">Filter</Button>
      <Button asChild variant="ghost">
        <Link href="/portal/audit-log">Clear</Link>
      </Button>
    </form>
  );
}

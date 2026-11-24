import { LinkCard } from "@/components/shared/link-card";
import type { DepartmentRecord } from "@/server/repositories/department.repository";

export function DepartmentCard({ department }: { department: DepartmentRecord }) {
  return (
    <LinkCard
      href={`/departments/${department.slug}`}
      title={department.name}
      description={department.purpose}
      cta="View department"
    />
  );
}

import { connection } from "next/server";

import { DepartmentCard } from "@/components/site/department-card";
import { getDepartments } from "@/server/services/department.service";

export async function DepartmentList() {
  await connection();
  const departments = await getDepartments();

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {departments.map((department) => (
        <DepartmentCard key={department.id} department={department} />
      ))}
    </div>
  );
}

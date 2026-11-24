import { FilterBar, FilterInput, FilterSelect } from "@/components/portal/list-filters";
import { ROLE_OPTIONS } from "@/lib/constants/labels";
import type { ListUsersQuery } from "@/lib/validations/user";

export function UsersFilter({ query }: { query: ListUsersQuery }) {
  return (
    <FilterBar
      basePath="/portal/users"
      label="Filter users"
      resetKey={`${query.q ?? ""}|${query.role ?? ""}`}
      sort={query.sort}
    >
      <FilterInput
        id="users-q"
        name="q"
        label="Search"
        value={query.q}
        placeholder="Name or email"
        className="w-64"
      />
      <FilterSelect
        id="users-role"
        name="role"
        label="Role"
        value={query.role}
        options={ROLE_OPTIONS}
        allLabel="All roles"
        className="w-44"
      />
    </FilterBar>
  );
}

import { FilterBar, FilterInput, FilterSelect } from "@/components/portal/list-filters";
import { MESSAGE_STATUS_LABELS, MESSAGE_SUBJECT_LABELS, toOptions } from "@/lib/constants/labels";
import type { ListMessagesQuery } from "@/lib/validations/message";

export function MessagesFilter({ query }: { query: ListMessagesQuery }) {
  return (
    <FilterBar
      basePath="/portal/messages"
      label="Filter messages"
      resetKey={[query.q, query.status, query.subject].join("|")}
      sort={query.sort}
    >
      <FilterInput
        id="messages-q"
        name="q"
        label="Search"
        value={query.q}
        placeholder="Name or email"
      />
      <FilterSelect
        id="messages-status"
        name="status"
        label="Status"
        value={query.status}
        options={toOptions(MESSAGE_STATUS_LABELS)}
        allLabel="All statuses"
        className="w-40"
      />
      <FilterSelect
        id="messages-subject"
        name="subject"
        label="Subject"
        value={query.subject}
        options={toOptions(MESSAGE_SUBJECT_LABELS)}
        allLabel="All subjects"
        className="w-44"
      />
    </FilterBar>
  );
}

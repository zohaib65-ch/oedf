import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * A field real visitors never see or reach by keyboard. A bot that fills in every field fills this
 * one too, and the server then refuses the submission.
 *
 * Browsers autofill some fields even with `autocomplete="off"` (Chrome filled this one with a saved
 * phone number, which blocked real visitors). Autofill skips read-only fields, so it starts
 * read-only and only becomes typeable when something focuses it, which a visitor never does.
 */
export function HoneypotField({ register }: { register: (name: "faxNumber") => object }) {
  return (
    <div aria-hidden="true" className="absolute -left-2499.75 h-0 w-0 overflow-hidden">
      <Label>
        Leave this field empty
        <Input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          readOnly
          onFocus={(event) => {
            const input = event.currentTarget;
            input.readOnly = false;
          }}
          {...register("faxNumber")}
        />
      </Label>
    </div>
  );
}

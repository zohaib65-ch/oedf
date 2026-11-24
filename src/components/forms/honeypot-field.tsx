import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * A field real visitors never see or reach by keyboard. A bot that fills in every field fills this
 * one too, and the server then refuses the submission. Its name avoids what browsers autofill.
 */
export function HoneypotField({ register }: { register: (name: "faxNumber") => object }) {
  return (
    <div aria-hidden="true" className="absolute -left-2499.75 h-0 w-0 overflow-hidden">
      <Label>
        Fax number
        <Input type="text" tabIndex={-1} autoComplete="off" {...register("faxNumber")} />
      </Label>
    </div>
  );
}

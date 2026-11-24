/**
 * A field real visitors never see or reach by keyboard. A bot that fills in every field fills this
 * one too, and the server then refuses the submission. Its name avoids what browsers autofill.
 */
export function HoneypotField({ register }: { register: (name: "faxNumber") => object }) {
  return (
    <div aria-hidden="true" className="absolute -left-2499.75 h-0 w-0 overflow-hidden">
      <label>
        Fax number
        <input type="text" tabIndex={-1} autoComplete="off" {...register("faxNumber")} />
      </label>
    </div>
  );
}

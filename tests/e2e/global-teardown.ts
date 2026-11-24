import { runTestAccounts } from "./global-setup";

/** Removes the throwaway accounts and every record the tests made. */
export default function globalTeardown(): void {
  runTestAccounts("clean");
}

import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";

/** Asks one question in the terminal. A hidden answer (a password) is not echoed back. */
export async function ask(question: string, { isHidden = false } = {}): Promise<string> {
  let isMuted = false;
  const output = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      if (!isMuted) {
        process.stdout.write(chunk);
      }
      callback();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  const answer = rl.question(question);
  // The question itself is already printed, so hide only what is typed from here on.
  isMuted = isHidden;
  try {
    return (await answer).trim();
  } finally {
    rl.close();
    if (isHidden) {
      process.stdout.write("\n");
    }
  }
}

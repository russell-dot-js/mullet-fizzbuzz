import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export function stamp(seals) {
  if (!seals.length) return [];
  const asset = name => fileURLToPath(new URL(name, import.meta.url));
  const result = spawnSync("java", [asset("Mint.java"), asset("serial.jasm")], {
    input: seals.join("\n") + "\n", encoding: "utf8",
    maxBuffer: Math.max(1048576, 10 * seals.length),
  });
  if (result.error || result.status !== 0) throw Error(result.error?.message ?? result.stderr);
  const serials = result.stdout.trimEnd().split("\n");
  if (serials.length !== seals.length || serials.some(s => !/^[0-9a-f]{1,8}$/.test(s))) {
    throw Error("The mint delivered a sheet of blank or surplus stamps.");
  }
  return serials;
}

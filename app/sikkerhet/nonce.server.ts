import { randomBytes } from "node:crypto";

/** Lager en ny, uforutsigbar nonce (128 bit fra CSPRNG). Skal genereres per forespørsel. */
export function lagNonce(): string {
  return randomBytes(16).toString("base64");
}

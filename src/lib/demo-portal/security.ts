import type { DemoAccount, DemoRole, DemoSession } from "./types";

const HASH_ALGORITHM = "PBKDF2";
const HASH_ITERATIONS = 120_000;
const HASH_LENGTH = 256;
const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  if (hex.length % 2 !== 0 || !/^[a-f\d]+$/i.test(hex)) return new Uint8Array();
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function randomHex(size = 16): string {
  const bytes = new Uint8Array(size);
  globalThis.crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function derivePasswordHash(
  password: string,
  saltHex: string,
  iterations: number,
): Promise<string> {
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    HASH_ALGORITHM,
    false,
    ["deriveBits"],
  );
  const bits = await globalThis.crypto.subtle.deriveBits(
    {
      name: HASH_ALGORITHM,
      hash: "SHA-256",
      salt: hexToBytes(saltHex),
      iterations,
    },
    key,
    HASH_LENGTH,
  );

  return bytesToHex(new Uint8Array(bits));
}

export async function hashDemoPassword(
  password: string,
  saltHex = randomHex(),
): Promise<string> {
  if (!password) throw new Error("Demo passwords cannot be empty.");
  const digest = await derivePasswordHash(password, saltHex, HASH_ITERATIONS);
  return `pbkdf2-sha256:${HASH_ITERATIONS}:${saltHex}:${digest}`;
}

export async function verifyDemoPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [algorithm, iterationsValue, saltHex, expectedHash] = storedHash.split(":");
  const iterations = Number(iterationsValue);
  if (
    algorithm !== "pbkdf2-sha256" ||
    !Number.isInteger(iterations) ||
    iterations <= 0 ||
    !saltHex ||
    !expectedHash
  ) {
    return false;
  }

  const actualHash = await derivePasswordHash(password, saltHex, iterations);
  if (actualHash.length !== expectedHash.length) return false;
  let difference = 0;
  for (let index = 0; index < actualHash.length; index += 1) {
    difference |= actualHash.charCodeAt(index) ^ expectedHash.charCodeAt(index);
  }
  return difference === 0;
}

export function normaliseLoginCode(value: string): string {
  return value.trim().toLocaleUpperCase("it-IT").replace(/\s+/g, "-");
}

export async function authenticateDemoAccount(
  accounts: readonly DemoAccount[],
  loginCode: string,
  password: string,
  expectedRole?: DemoRole,
): Promise<
  | { ok: true; account: DemoAccount }
  | { ok: false; reason: "invalid_credentials" | "inactive_account" | "wrong_role" }
> {
  const normalisedCode = normaliseLoginCode(loginCode);
  const account = accounts.find((candidate) => candidate.loginCode === normalisedCode);
  if (!account || !(await verifyDemoPassword(password, account.passwordHash))) {
    return { ok: false, reason: "invalid_credentials" };
  }
  if (!account.active) return { ok: false, reason: "inactive_account" };
  if (expectedRole && account.role !== expectedRole) {
    return { ok: false, reason: "wrong_role" };
  }
  return { ok: true, account };
}

export function isDemoSessionCurrent(
  accounts: readonly DemoAccount[],
  session: DemoSession | null,
): boolean {
  if (!session || !Number.isInteger(session.credentialVersion)) return false;
  const account = accounts.find((candidate) => candidate.id === session.accountId);
  return Boolean(
    account?.active &&
      account.role === session.role &&
      account.loginCode === session.loginCode &&
      account.credentialVersion === session.credentialVersion,
  );
}

export function generateDemoPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(12);
  globalThis.crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8)}!`;
}

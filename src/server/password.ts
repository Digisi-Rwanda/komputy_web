import "server-only";
import { hash, verify } from "@node-rs/argon2";
import { env } from "@/server/env";

const opts = { memoryCost: env.ARGON2_MEMORY_COST, timeCost: env.ARGON2_TIME_COST, parallelism: env.ARGON2_PARALLELISM };

export const hashPassword = (plain: string) => hash(plain, opts);
/** Verifies argon2id hashes created by the previous engine (python argon2-cffi) or by this app. */
export const verifyPassword = ({ hash: h, password }: { hash: string; password: string }) => verify(h, password).catch(() => false);

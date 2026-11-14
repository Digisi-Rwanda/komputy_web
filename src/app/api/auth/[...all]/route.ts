import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/auth";

// Sign-in, sign-up, sessions, 2FA, organizations, invitations and /api/auth/jwks (read by ECL-Server).
export const { GET, POST } = toNextJsHandler(auth);

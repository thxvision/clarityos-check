import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "./db";

export async function getSecret() {
  const c = await cookies();
  return c.get(ADMIN_COOKIE)?.value || null;
}

export async function secretFromRequest(req) {
  const c = req.cookies?.get?.(ADMIN_COOKIE)?.value;
  return c || null;
}

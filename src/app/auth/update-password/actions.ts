"use server";

import { isPasswordLeaked } from "@/lib/auth/checkLeakedPassword";

/**
 * Server action intermediary for the UpdatePasswordClient component.
 * We must use a server action here because checkLeakedPassword uses Node's `crypto` module,
 * which cannot be imported directly into a Client Component.
 */
export async function checkPasswordAction(password: string) {
  return await isPasswordLeaked(password);
}

import crypto from "crypto";

export async function isPasswordLeaked(password: string): Promise<boolean> {
  const hash = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
    });

    if (!res.ok) return false; // fail open — never block signup on API downtime
    const text = await res.text();
    return text.split("\n").some((line) => line.startsWith(suffix));
  } catch (error) {
    // fail open on network errors
    return false;
  }
}

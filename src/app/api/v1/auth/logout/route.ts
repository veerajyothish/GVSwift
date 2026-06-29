import { NextRequest, NextResponse } from "next/server";
import { logoutUser } from "@/features/auth/service";
import { toSafeError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    await logoutUser();

    const response = NextResponse.json(
      { message: "Successfully logged out" },
      { status: 200 }
    );

    // Explicitly delete all Supabase auth cookies in the response
    const sbCookies = request.cookies.getAll().filter((c) =>
      c.name.startsWith("sb-")
    );
    sbCookies.forEach((c) => {
      response.cookies.delete(c.name);
    });

    return response;
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}

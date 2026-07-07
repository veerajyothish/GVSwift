import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { type User } from "@prisma/client";
import { isValidRedirect } from "@/lib/env";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  // B12: ref param may be passed as ?ref= in the redirectTo URL from Google OAuth
  const refParam = searchParams.get("ref") ?? request.cookies.get("gvs_ref")?.value;

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.user) {
      const supabaseUser = data.user;
      
      let prismaUser: User | null = null;
      try {
        // Find existing user in Prisma DB by supabaseId or email
        let foundUser = await prisma.user.findUnique({
          where: { supabaseId: supabaseUser.id },
        });

        const email = supabaseUser.email || supabaseUser.user_metadata?.email;

        if (!foundUser && email) {
          foundUser = await prisma.user.findUnique({
            where: { email },
          });
        }

        if (!foundUser) {
          if (email) {
            foundUser = await prisma.user.create({
              data: {
                supabaseId: supabaseUser.id,
                email,
                name: supabaseUser.user_metadata?.full_name || null,
              },
            });
          }
        } else if (foundUser.supabaseId !== supabaseUser.id) {
          // If user exists by email but has no supabaseId or a different one, update it to sync
          await prisma.user.update({
            where: { id: foundUser.id },
            data: { supabaseId: supabaseUser.id },
          });
        }
        prismaUser = foundUser;
      } catch (dbErr) {
        console.error("Failed to sync user to Prisma during auth callback:", dbErr);
      }

      // Sync role to Supabase metadata if user exists
      if (prismaUser) {
        try {
          const adminSupabase = createSupabaseAdminClient();
          await adminSupabase.auth.admin.updateUserById(supabaseUser.id, {
            user_metadata: { role: prismaUser.role },
          });
        } catch (syncErr) {
          console.error("Failed to sync user role to Supabase metadata during auth callback:", syncErr);
        }
      }

      // B12: Link referral for Google OAuth flow
      if (refParam && prismaUser) {
        try {
          const refCodeRow = await prisma.referralCode.findUnique({
            where: { code: refParam.toUpperCase() },
          });
          if (refCodeRow && refCodeRow.userId !== prismaUser.id) {
            const existing = await prisma.referralUse.findUnique({
              where: { referredUserId: prismaUser.id },
            });
            if (!existing) {
              await prisma.referralUse.create({
                data: {
                  referralCodeId: refCodeRow.id,
                  referredUserId: prismaUser.id,
                  pointsAwarded: 0,
                },
              });
            }
          }
        } catch (refErr) {
          logger.warn({ refParam, error: refErr }, "Failed to record referral during OAuth callback");
        }
      }

      let redirectPath = nextParam;
      if (!isValidRedirect(redirectPath)) {
        redirectPath = prismaUser?.role === "ADMIN" ? "/admin" : "/";
      }
      const redirectUrl = `${origin}${redirectPath}`;
      const response = NextResponse.redirect(redirectUrl);
      // Clear the referral cookie
      if (refParam) {
        response.cookies.set("gvs_ref", "", { maxAge: 0, path: "/" });
      }
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

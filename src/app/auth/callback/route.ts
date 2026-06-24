import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.user) {
      const supabaseUser = data.user;
      
      try {
        // Find existing user in Prisma DB by supabaseId or email
        let prismaUser = await prisma.user.findUnique({
          where: { supabaseId: supabaseUser.id },
        });

        const email = supabaseUser.email || supabaseUser.user_metadata?.email;

        if (!prismaUser && email) {
          prismaUser = await prisma.user.findUnique({
            where: { email },
          });
        }

        if (!prismaUser) {
          if (email) {
            await prisma.user.create({
              data: {
                supabaseId: supabaseUser.id,
                email,
                name: supabaseUser.user_metadata?.full_name || null,
              },
            });
          }
        } else if (prismaUser.supabaseId !== supabaseUser.id) {
          // If user exists by email but has no supabaseId or a different one, update it to sync
          await prisma.user.update({
            where: { id: prismaUser.id },
            data: { supabaseId: supabaseUser.id },
          });
        }
      } catch (dbErr) {
        console.error("Failed to sync user to Prisma during auth callback:", dbErr);
        // We still redirect because Supabase session is established,
        // but we log the error.
      }

      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}


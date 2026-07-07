import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import UpdatePasswordClient from "./UpdatePasswordClient";

export const metadata = {
  title: "Update Password | GVSwift",
};

interface PageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function UpdatePasswordPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const code = resolvedSearchParams.code;
  const supabase = await createSupabaseServerClient();

  if (code) {
    let success = false;
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.session) {
        success = true;
      }
    } catch (err) {
      console.error("Code exchange failed inside update-password server component:", err);
    }
    
    if (success) {
      redirect("/auth/update-password");
    }
  }

  // Retrieve user based on session cookies
  const { data: { user } } = await supabase.auth.getUser();
  const hasSession = !!user;

  return <UpdatePasswordClient hasSession={hasSession} />;
}

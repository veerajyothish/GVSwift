import { createSupabaseServerClient } from "@/lib/supabase/server";
import UpdatePasswordClient from "./UpdatePasswordClient";

export const metadata = {
  title: "Update Password | GVSwift",
};

export default async function UpdatePasswordPage() {
  const supabase = await createSupabaseServerClient();

  // Retrieve user based on session cookies
  const { data: { user } } = await supabase.auth.getUser();
  const hasSession = !!user;

  return <UpdatePasswordClient hasSession={hasSession} />;
}

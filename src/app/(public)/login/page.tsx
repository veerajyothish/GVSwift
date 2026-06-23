import { Suspense } from "react";
import LoginClient from "./LoginClient";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";

export default async function LoginPage() {
  const session = await getServerSession();
  if (session) {
    redirect("/");
  }

  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  );
}

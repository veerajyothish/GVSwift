import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import SignupClient from "./SignupClient";

export const metadata = {
  title: "Create Account",
};

export default async function SignupPage() {
  const session = await getServerSession();
  if (session) {
    redirect("/");
  }

  return (
    <Suspense fallback={null}>
      <SignupClient />
    </Suspense>
  );
}

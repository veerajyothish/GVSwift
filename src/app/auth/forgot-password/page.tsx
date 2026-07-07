import { Suspense } from "react";
import ForgotPasswordClient from "./ForgotPasswordClient";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";

export const metadata = {
  title: "Reset Password | GVSwift",
  description: "Request a password reset link for your GVSwift account.",
};

export default async function ForgotPasswordPage() {
  const session = await getServerSession();
  if (session) {
    redirect("/");
  }

  return (
    <Suspense fallback={null}>
      <ForgotPasswordClient />
    </Suspense>
  );
}

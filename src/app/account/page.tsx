import { redirect } from "next/navigation";

export default async function AccountPage() {
  // Redirect immediately to profile — the layout handles the full page UI
  redirect("/account/profile");
}
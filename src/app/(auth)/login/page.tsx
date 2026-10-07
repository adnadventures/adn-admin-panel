import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-hero-gradient hidden flex-col justify-between p-10 text-[#1C1917] lg:flex">
        <span className="text-sm font-semibold tracking-widest uppercase">Admin Panel</span>
        <div>
          <h1 className="text-5xl font-bold tracking-tight">ADN Adventures</h1>
          <p className="mt-3 text-xl italic">Your Travel Our Responsibilities</p>
        </div>
        <p className="text-sm">© {new Date().getFullYear()} ADN Adventures</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <LoginForm />
      </div>
    </main>
  );
}
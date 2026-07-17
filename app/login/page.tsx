"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const statusMessage = searchParams.get("message");
  const statusVariant = searchParams.get("variant") ?? "success";

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        router.push("/upload?message=Account%20created%20and%20you%20are%20signed%20in.&variant=success");
      } else {
        router.push("/login?message=Account%20created.%20Check%20your%20email%20to%20confirm%20your%20account.&variant=success");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push("/upload?message=Logged%20in%20successfully.&variant=success");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] via-white to-[#ECFEFF] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-8 shadow-2xl shadow-slate-200/60 backdrop-blur">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-2">
          {isSignUp ? "Create account" : "Welcome back"}
        </h1>
        <p className="text-[#64748B] mb-6">
          {isSignUp ? "Sign up to use MedLens AI" : "Sign in to MedLens AI"}
        </p>

        {statusMessage && (
          <div
            className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
              statusVariant === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {statusMessage}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
          />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-xl bg-[#0EA5E9] py-3 font-semibold text-white shadow-lg shadow-[#0EA5E9]/20 transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
          <p className="text-center text-sm text-[#64748B]">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-semibold text-[#0EA5E9] hover:text-[#0369A1]"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
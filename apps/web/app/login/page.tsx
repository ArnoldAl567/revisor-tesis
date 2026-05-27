"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { authApi } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import { useApp } from "@/lib/ThemeContext";

export default function LoginPage() {
  const { t } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("coord@test.com");
  const [password, setPassword] = useState("Thesis123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await authApi.login(email, password);
      setAuth(res.data.accessToken, res.data.user);
      router.push("/");
    } catch (err: unknown) {
      let msg = t("login.error.default");
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        if (data?.message) msg = data.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfdfb] p-6">
      <form onSubmit={submit} className="w-full max-w-md bg-white border rounded-[32px] p-10 shadow-sm space-y-5">
        <h1 className="text-2xl font-bold text-slate-900">ThesisReview</h1>
        <p className="text-sm text-slate-500">{t("login.subtitle")}</p>
        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}
        <input
          type="email"
          className="w-full border rounded-xl p-3 text-sm"
          placeholder={t("login.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full border rounded-xl p-3 text-sm"
          placeholder={t("login.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#185FA5] text-white py-3 rounded-2xl font-bold disabled:opacity-50"
        >
          {loading ? t("login.signingIn") : t("login.signin")}
        </button>
        <p className="text-[10px] text-slate-400">
          {t("login.demo")}
        </p>
      </form>
    </div>
  );
}

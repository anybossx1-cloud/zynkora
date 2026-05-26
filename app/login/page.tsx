"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Error iniciando sesión");
        setLoading(false);
        return;
      }

      localStorage.setItem("auth", "true");

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      router.push("/");
    } catch (error) {
      console.log(error);
      alert("Error iniciando sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0f172a,black_60%)]" />

      <div className="w-[420px] bg-[#081225]/90 backdrop-blur-xl border border-[#1a2b4b] rounded-3xl p-8 relative z-10 shadow-[0_0_60px_rgba(0,229,255,0.08)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-400 flex items-center justify-center text-white font-black text-xl">
            Z
          </div>

          <div>
            <h1 className="text-white text-3xl font-black">
              Zynkora
            </h1>

            <p className="text-cyan-300 text-xs tracking-[0.3em] uppercase">
              Communications OS
            </p>
          </div>
        </div>

        <p className="text-gray-400 mb-8">
          Iniciar sesión en la plataforma
        </p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-14 bg-[#0d1b34] border border-[#1e335c] rounded-2xl px-5 text-white outline-none focus:border-cyan-400 transition"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-14 bg-[#0d1b34] border border-[#1e335c] rounded-2xl px-5 text-white outline-none focus:border-cyan-400 transition"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full h-14 mt-7 bg-gradient-to-r from-purple-600 to-cyan-400 rounded-2xl text-white font-black tracking-wide disabled:opacity-50 hover:scale-[1.01] transition"
        >
          {loading ? "Ingresando..." : "Entrar"}
        </button>

        <div className="mt-6 text-center text-xs text-slate-500">
          Secure Access · Multi User System
        </div>
      </div>
    </div>
  );
}
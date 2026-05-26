"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [appName, setAppName] = useState("");
  const [telnyxNumber, setTelnyxNumber] = useState("");
  const [sound, setSound] = useState(true);
  const [estado, setEstado] = useState("");

  useEffect(() => {
    async function cargarSettings() {
      const res = await fetch("/api/settings");
      const data = await res.json();

      setAppName(data.appName || "Zynkora SMS");
      setTelnyxNumber(data.telnyxNumber || "");
      setSound(data.sound !== false);
    }

    cargarSettings();
  }, []);

  async function guardarSettings() {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appName,
        telnyxNumber,
        sound,
      }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("sound", String(sound));
      setEstado("✅ Configuración guardada");
    } else {
      setEstado("❌ Error guardando configuración");
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold">Settings</h1>
            <p className="text-slate-400 mt-2">
              Configuración de Zynkora SMS
            </p>
          </div>

          <a
            href="/"
            className="bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-xl"
          >
            ← Volver
          </a>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">
              Información editable
            </h2>

            <div className="space-y-4">
              <input
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Nombre de la app"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 outline-none"
              />

              <input
                value={telnyxNumber}
                onChange={(e) => setTelnyxNumber(e.target.value)}
                placeholder="Número Telnyx activo"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">
              Sonido de notificaciones
            </h2>

            <div className="flex items-center justify-between">
              <p className="text-slate-400">
                Activar o desactivar sonidos
              </p>

              <button
                onClick={() => setSound(!sound)}
                className={`px-6 py-3 rounded-xl font-bold ${
                  sound
                    ? "bg-emerald-500 text-black"
                    : "bg-red-500 text-white"
                }`}
              >
                {sound ? "ACTIVADO" : "DESACTIVADO"}
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">
              Información del sistema
            </h2>

            <div className="space-y-3 text-slate-300">
              <p>
                <span className="font-bold text-white">Base URL:</span>{" "}
                {process.env.NEXT_PUBLIC_BASE_URL}
              </p>

              <p>
                <span className="font-bold text-white">Estado:</span>{" "}
                <span className="text-emerald-400">ONLINE</span>
              </p>
            </div>
          </div>

          <button
            onClick={guardarSettings}
            className="w-full bg-blue-500 hover:bg-blue-600 rounded-xl p-4 font-bold text-white"
          >
            Guardar configuración
          </button>

          <p className="text-slate-400">{estado}</p>
        </div>
      </div>
    </main>
  );
}
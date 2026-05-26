"use client";

import { useEffect, useState } from "react";

export default function CallsPage() {
  const [calls, setCalls] = useState<any[]>([]);

  useEffect(() => {
    async function cargarCalls() {
      const res = await fetch("/api/calls");
      const data = await res.json();

      if (Array.isArray(data)) {
        setCalls(data);
      }
    }

    cargarCalls();
  }, []);

  function horaBonita(fecha: string) {
    if (!fecha) return "";

    return new Date(fecha).toLocaleString("es-DO", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Call Logs</h1>
            <p className="text-slate-400 mt-2">
              Historial de llamadas de Zynkora Voice
            </p>
          </div>

          <a
            href="/"
            className="bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-xl"
          >
            ← Volver
          </a>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {calls.length === 0 ? (
            <p className="p-6 text-slate-400">
              No hay llamadas registradas.
            </p>
          ) : (
            calls.map((call) => (
              <div
                key={call.id}
                className="p-5 border-b border-slate-800 flex justify-between items-center"
              >
                <div>
                  <p className="text-xl font-bold">
                    {call.type === "outgoing" ? "📞 Saliente" : "📲 Entrante"}
                  </p>

                  <p className="text-slate-300 mt-1">
                    {call.number}
                  </p>

                  <p className="text-slate-500 text-sm mt-1">
                    {horaBonita(call.createdAt)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-emerald-400 font-bold">
                    {call.duration || "00:00"}
                  </p>

                  <p className="text-slate-500 text-sm">
                    {call.type}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
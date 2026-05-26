"use client";

import { useEffect, useState } from "react";

export default function NumbersPage() {
  const [numbers, setNumbers] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    async function cargarDatos() {
      const numbersRes = await fetch("/api/numbers");
      const numbersData = await numbersRes.json();

      const assignmentsRes = await fetch("/api/number-assignments");
      const assignmentsData = await assignmentsRes.json();

      if (Array.isArray(numbersData)) setNumbers(numbersData);
      if (Array.isArray(assignmentsData)) setAssignments(assignmentsData);
    }

    cargarDatos();
  }, []);

  function contactosAsignados(number: string) {
    return assignments.filter((item) => item.assignedNumber === number);
  }

  return (
    <main className="min-h-screen bg-[#050810] text-slate-200 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
              Number Pool
            </h1>
            <p className="text-slate-500 mt-2">
              Control de números rotativos de Zynkora
            </p>
          </div>

          <a
            href="/"
            className="bg-[#111827] hover:bg-[#1a2235] border border-[#1e2d45] px-5 py-3 rounded-xl"
          >
            ← Volver
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {numbers.map((number) => {
            const asignados = contactosAsignados(number);

            return (
              <div
                key={number}
                className="bg-[#090d1a] border border-[#1e2d45] rounded-3xl p-5 shadow-[0_0_30px_rgba(0,229,255,0.04)]"
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">
                      Telnyx Number
                    </p>

                    <h2 className="text-xl font-black mt-2 text-cyan-300">
                      {number}
                    </h2>
                  </div>

                  <div className="text-xs bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 px-3 py-1 rounded-full">
                    Active
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-4">
                    <p className="text-xs text-slate-500">Asignados</p>
                    <p className="text-3xl font-black mt-1">
                      {asignados.length}
                    </p>
                  </div>

                  <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-4">
                    <p className="text-xs text-slate-500">Modo</p>
                    <p className="text-sm font-bold mt-2 text-purple-300">
                      Sticky
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs text-slate-500 mb-2">
                    Contactos asignados
                  </p>

                  {asignados.length === 0 ? (
                    <p className="text-sm text-slate-600">
                      Sin contactos todavía.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {asignados.map((item, index) => (
                        <div
                          key={index}
                          className="bg-[#111827] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm"
                        >
                          {item.contact}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
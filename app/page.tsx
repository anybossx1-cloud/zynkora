"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState("");
  const [historial, setHistorial] = useState<any[]>([]);
  const [chatActivo, setChatActivo] = useState("");
  const [nuevoNumero, setNuevoNumero] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [previewImagen, setPreviewImagen] = useState("");
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [nombreContacto, setNombreContacto] = useState("");
  const [alertaNueva, setAlertaNueva] = useState("");
  const [incomingCall, setIncomingCall] = useState<any>(null);

  const chatRef = useRef<HTMLDivElement>(null);
  const chatActivoRef = useRef("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const ultimoInboundIdRef = useRef("");

  useEffect(() => {
    const auth = localStorage.getItem("auth");
    if (auth !== "true") window.location.href = "/login";
  }, []);

  useEffect(() => {
    chatActivoRef.current = chatActivo;
  }, [chatActivo]);

  function activarAudio() {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/notification.mp3");
    }

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }

  function mostrarNotificacionDesktop(nombre: string, mensajeTexto: string, numero: string) {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const preview = mensajeTexto?.trim()
      ? mensajeTexto
      : "Nuevo mensaje recibido";

    const notification = new Notification(`Zynkora SMS · ${nombre}`, {
      body: preview,
      tag: numero,
      silent: false,
    });

    notification.onclick = () => {
      window.focus();
      setChatActivo(numero);
      marcarLeido(numero);
      notification.close();
    };
  }

  async function guardarCall(number: string, type: string, duration = "00:00") {
    await fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number, type, duration }),
    });
  }

  async function llamarContacto() {
    if (!chatActivo) return;

    try {
      await guardarCall(chatActivo, "outgoing", "00:00");
      window.location.href = `sip:${chatActivo}@sip.telnyx.com`;
    } catch (error) {
      console.log("ERROR GUARDANDO LLAMADA:", error);
      window.location.href = `sip:${chatActivo}@sip.telnyx.com`;
    }
  }

  function simularLlamadaEntrante() {
    const llamada = {
      from: chatActivo || "+17192471472",
      name: chatActivo ? obtenerNombre(chatActivo) : "Llamada entrante",
    };

    setIncomingCall(llamada);

    if (ringtoneRef.current) {
      ringtoneRef.current.loop = true;
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current.play().catch(() => {});
    }
  }

  async function contestarLlamada() {
    if (!incomingCall) return;

    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }

    await guardarCall(incomingCall.from, "incoming", "00:00");
    setChatActivo(incomingCall.from);
    setIncomingCall(null);
    setEstado("✅ Llamada contestada");
  }

  async function rechazarLlamada() {
    if (!incomingCall) return;

    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }

    await guardarCall(incomingCall.from, "missed", "00:00");
    setIncomingCall(null);
    setEstado("📵 Llamada perdida");
  }

  function horaBonita(fecha: string) {
    if (!fecha) return "";
    return new Date(fecha).toLocaleTimeString("es-DO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function obtenerNombre(numero: string) {
    const contacto = contacts.find((c) => c.phone === numero);
    return contacto?.name || numero;
  }

  function iniciales(nombre: string) {
    return nombre.replace("+", "").slice(0, 2).toUpperCase();
  }

  function unreadCount(numero: string) {
    return historial.filter((msg) => {
      const numeroMensaje = msg.direction === "inbound" ? msg.from : msg.to;

      return (
        numeroMensaje === numero &&
        msg.direction === "inbound" &&
        msg.read === false
      );
    }).length;
  }

  function totalUnread(mensajes: any[]) {
    return mensajes.filter(
      (msg) => msg.direction === "inbound" && msg.read === false
    ).length;
  }

  async function cargarMensajes(silencioso = false) {
    const res = await fetch("/api/messages");
    const data = await res.json();

    if (data.success) {
      const mensajes = [...data.messages].reverse();
      const ultimoInbound = mensajes.find((msg) => msg.direction === "inbound");

      if (ultimoInbound && !ultimoInboundIdRef.current) {
        ultimoInboundIdRef.current =
          ultimoInbound.id || ultimoInbound.messageId || ultimoInbound.createdAt;
      }

      if (
        !silencioso &&
        ultimoInbound &&
        ultimoInboundIdRef.current &&
        ultimoInboundIdRef.current !==
          (ultimoInbound.id || ultimoInbound.messageId || ultimoInbound.createdAt)
      ) {
        const numero = ultimoInbound.from;
        const nombre = obtenerNombre(numero);
        const texto = ultimoInbound.message || "Nuevo mensaje recibido";

        audioRef.current?.play().catch(() => {});
        setAlertaNueva(`Nuevo mensaje de ${nombre}`);

        setTimeout(() => setAlertaNueva(""), 4000);

        mostrarNotificacionDesktop(nombre, texto, numero);

        ultimoInboundIdRef.current =
          ultimoInbound.id || ultimoInbound.messageId || ultimoInbound.createdAt;
      }

      const total = totalUnread(mensajes);
      document.title = total > 0 ? `(${total}) Zynkora SMS` : "Zynkora SMS";

      setHistorial(mensajes);

      if (!chatActivoRef.current && mensajes.length > 0) {
        const primerNumero =
          mensajes[0].direction === "inbound" ? mensajes[0].from : mensajes[0].to;

        setChatActivo(primerNumero);
      }
    }
  }

  async function cargarContactos() {
    const res = await fetch("/api/contacts");
    const data = await res.json();

    if (data.success) setContacts(data.contacts);
  }

  useEffect(() => {
    audioRef.current = new Audio("/sounds/notification.mp3");
    ringtoneRef.current = new Audio("/sounds/ringtone.mp3");

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    cargarMensajes(true);
    cargarContactos();

    const intervalo = setInterval(() => cargarMensajes(false), 3000);
    return () => clearInterval(intervalo);
  }, []);

  async function marcarLeido(phone: string) {
    if (!phone) return;

    await fetch("/api/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    cargarMensajes(true);
  }

  async function guardarNombreContacto() {
    if (!chatActivo || !nombreContacto.trim()) return;

    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: chatActivo, name: nombreContacto }),
    });

    const data = await res.json();

    if (data.success) {
      setEstado("✅ Contacto guardado");
      setNombreContacto("");
      cargarContactos();
    }
  }

  function crearNuevoChat() {
    if (!nuevoNumero.trim()) return;

    setChatActivo(nuevoNumero.trim());
    setNuevoNumero("");
    setEstado("Nuevo chat creado.");
  }

  async function enviarSMS() {
    if (!chatActivo || (!mensaje.trim() && !imagen)) return;

    setEstado("Enviando mensaje...");

    let mediaUrl = null;

    if (imagen) {
      const formData = new FormData();
      formData.append("file", imagen);

      const uploadRes = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadData.success) {
        setEstado("❌ Error subiendo imagen");
        return;
      }

      mediaUrl = process.env.NEXT_PUBLIC_BASE_URL + uploadData.url;
    }

    const respuesta = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: chatActivo, message: mensaje, mediaUrl }),
    });

    const data = await respuesta.json();

    if (data.success) {
      setEstado("✅ Mensaje enviado");
      setMensaje("");
      setImagen(null);
      setPreviewImagen("");
      cargarMensajes(true);
    } else {
      console.log("ERROR FRONTEND:", data);
      setEstado("❌ Error enviando mensaje");
    }
  }

  const conversacionesGuardadas = Array.from(
    new Set(historial.map((msg) => (msg.direction === "inbound" ? msg.from : msg.to)))
  );

  const conversaciones = chatActivo
    ? Array.from(new Set([chatActivo, ...conversacionesGuardadas]))
    : conversacionesGuardadas;

  function ultimoMensaje(numero: any) {
    return historial.find((msg) => {
      const numeroMensaje = msg.direction === "inbound" ? msg.from : msg.to;
      return numeroMensaje === numero;
    });
  }

  const conversacionesFiltradas = conversaciones.filter((numero) => {
    const n = numero as string;
    const nombre = obtenerNombre(n).toLowerCase();
    return nombre.includes(search.toLowerCase()) || n.includes(search);
  });

  const mensajesChat = historial
    .filter((msg) => {
      const numeroMensaje = msg.direction === "inbound" ? msg.from : msg.to;
      return numeroMensaje === chatActivo;
    })
    .reverse();

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    if (chatActivo) marcarLeido(chatActivo);
  }, [mensajesChat.length, chatActivo]);

  return (
    <main
      onClick={activarAudio}
      className="h-screen overflow-hidden bg-[#050810] text-slate-200 flex relative font-sans"
    >
      {incomingCall && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center">
          <div className="bg-[#090d1a] w-[420px] rounded-3xl p-8 border border-cyan-500/30 text-center shadow-[0_0_50px_rgba(0,229,255,0.15)]">
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-purple-600 to-cyan-400 mx-auto flex items-center justify-center text-5xl">
              📞
            </div>

            <h1 className="text-white text-3xl font-bold mt-6">
              {incomingCall.name}
            </h1>

            <p className="text-slate-400 mt-2 text-lg">{incomingCall.from}</p>

            <p className="text-cyan-400 mt-4 animate-pulse font-bold">
              Incoming Call...
            </p>

            <div className="flex gap-4 mt-8">
              <button
                onClick={rechazarLlamada}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold"
              >
                Rechazar
              </button>

              <button
                onClick={contestarLlamada}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold"
              >
                Contestar
              </button>
            </div>
          </div>
        </div>
      )}

      {alertaNueva && (
        <div className="fixed top-5 right-5 z-50 bg-[#1a2235] border border-emerald-400 text-white font-bold px-6 py-4 rounded-2xl shadow-xl">
          🔔 {alertaNueva}
        </div>
      )}

      <aside className="w-[360px] min-w-[360px] bg-[#090d1a] border-r border-[#1e2d45] flex flex-col relative overflow-hidden">
        <div className="p-5 border-b border-[#1e2d45]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-400 flex items-center justify-center font-black text-white">
              Z
            </div>

            <div className="font-black tracking-widest uppercase bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
              Zynkora
            </div>

            <div className="ml-auto text-[10px] text-emerald-400 border border-emerald-400/60 px-2 py-1 rounded-md">
              v4.0
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
              ⌕
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversación..."
              className="w-full bg-[#111827] border border-[#1e2d45] focus:border-cyan-400 rounded-xl pl-9 pr-3 py-3 outline-none text-sm text-slate-200"
            />
          </div>
        </div>

        <div className="px-5 pt-4">
          <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-4">
            <h2 className="font-bold mb-3 text-sm">Nueva conversación</h2>

            <input
              value={nuevoNumero}
              onChange={(e) => setNuevoNumero(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") crearNuevoChat();
              }}
              placeholder="+1XXXXXXXXXX"
              className="w-full bg-[#050810] border border-[#2a3d5a] rounded-xl p-3 outline-none mb-3 text-sm"
            />

            <button
              onClick={crearNuevoChat}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-400 hover:opacity-90 text-white font-bold rounded-xl p-3 text-sm"
            >
              + Crear chat
            </button>
          </div>
        </div>

        <div className="text-[10px] font-bold text-slate-600 tracking-[0.2em] uppercase px-5 pt-5 pb-2">
          Mensajes recientes
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {conversacionesFiltradas.map((numero, index) => {
            const ultimo = ultimoMensaje(numero);
            const numeroTexto = numero as string;
            const unread = unreadCount(numeroTexto);
            const activo = chatActivo === numeroTexto;
            const nombre = obtenerNombre(numeroTexto);

            return (
              <button
                key={index}
                onClick={() => {
                  setChatActivo(numeroTexto);
                  marcarLeido(numeroTexto);
                }}
                className={`w-full text-left p-3 rounded-2xl transition border flex gap-3 ${
                  activo
                    ? "bg-[#1a2235] border-[#2a3d5a]"
                    : "border-transparent hover:bg-[#111827]"
                }`}
              >
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1a2d3d] to-[#0d4a6e] text-cyan-300 flex items-center justify-center font-black shrink-0 relative">
                  {iniciales(nombre)}
                  {activo && (
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#090d1a]" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <p className="font-bold text-sm truncate">{nombre}</p>
                    <p className="text-[10px] text-slate-600">
                      {horaBonita(ultimo?.createdAt || ultimo?.date)}
                    </p>
                  </div>

                  <p className="text-xs text-slate-400 truncate mt-1">
                    {ultimo?.mediaUrl ? "📷 Foto" : ultimo?.message || numeroTexto}
                  </p>
                </div>

                {unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-cyan-400 text-black text-xs font-black flex items-center justify-center">
                    {unread}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="border-t border-[#1e2d45] p-4 flex gap-3 justify-center">
          <a href="/" className="w-12 h-12 rounded-2xl bg-cyan-400 text-black flex items-center justify-center text-xl">
            💬
          </a>
          <a href="/calls" className="w-12 h-12 rounded-2xl bg-[#111827] hover:bg-[#1a2235] flex items-center justify-center text-xl">
            ☎️
          </a>
          <a href="/settings" className="w-12 h-12 rounded-2xl bg-[#111827] hover:bg-[#1a2235] flex items-center justify-center text-xl">
            ⚙️
          </a>
          <button
            onClick={simularLlamadaEntrante}
            className="w-12 h-12 rounded-2xl bg-purple-600 hover:bg-purple-700 flex items-center justify-center text-xl"
          >
            📳
          </button>
        </div>
      </aside>

      <section className="flex-1 flex flex-col bg-[#050810] relative overflow-hidden">
        <header className="px-6 py-4 border-b border-[#1e2d45] bg-[#090d1a] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1a3d2d] to-[#0d6e4a] text-emerald-300 flex items-center justify-center font-black relative">
            {chatActivo ? iniciales(obtenerNombre(chatActivo)) : "Z"}
            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#090d1a]" />
          </div>

          <div className="flex-1">
            <h1 className="font-black text-lg">
              {chatActivo ? obtenerNombre(chatActivo) : "Selecciona o crea un chat"}
            </h1>
            <p className="text-xs text-emerald-400 font-mono mt-1">
              ● SMS activo · Voz lista · {chatActivo}
            </p>
          </div>

          {chatActivo && (
            <button
              onClick={llamarContacto}
              className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-400 hover:bg-emerald-500/20"
              title="Llamar"
            >
              📞
            </button>
          )}

          <button
            onClick={() => {
              localStorage.removeItem("auth");
              window.location.href = "/login";
            }}
            className="w-10 h-10 rounded-xl bg-[#111827] border border-[#1e2d45] hover:border-red-400"
            title="Logout"
          >
            ⏻
          </button>
        </header>

        {chatActivo && (
          <div className="border-b border-[#1e2d45] bg-[#050810] p-4 flex gap-3">
            <input
              value={nombreContacto}
              onChange={(e) => setNombreContacto(e.target.value)}
              placeholder="Guardar nombre del contacto..."
              className="flex-1 bg-[#111827] border border-[#1e2d45] focus:border-cyan-400 rounded-xl p-3 outline-none text-sm"
            />

            <button
              onClick={guardarNombreContacto}
              className="bg-[#111827] hover:bg-[#1a2235] border border-[#2a3d5a] px-5 rounded-xl font-bold text-cyan-300 text-sm"
            >
              Guardar
            </button>
          </div>
        )}

        <div ref={chatRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="text-center text-[10px] text-slate-600 tracking-widest flex items-center gap-3">
            <div className="h-px bg-[#1e2d45] flex-1" />
            HOY
            <div className="h-px bg-[#1e2d45] flex-1" />
          </div>

          {mensajesChat.map((msg, index) => (
            <div
              key={index}
              className={`max-w-[72%] ${
                msg.direction === "outbound" ? "ml-auto" : ""
              }`}
            >
              <div
                className={`p-4 rounded-2xl border text-sm leading-relaxed ${
                  msg.direction === "outbound"
                    ? "bg-[#0d2d1e] border-emerald-500/80 rounded-br-md"
                    : "bg-[#0f172a] border-[#1e2d45] rounded-bl-md"
                }`}
              >
                {msg.mediaUrl && (
                  <img
                    src={msg.mediaUrl}
                    className="mb-3 max-w-xs rounded-xl border border-black/20"
                  />
                )}

                {msg.message && (
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                )}

                <p className="text-[10px] mt-2 text-slate-500 text-right font-mono">
                  {horaBonita(msg.createdAt || msg.date)}
                  {msg.direction === "outbound" && (
                    <> · {msg.deliveryStatus || msg.status || "sent"} ✓</>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        {previewImagen && (
          <div className="border-t border-[#1e2d45] p-4 bg-[#090d1a]">
            <div className="relative w-32">
              <img
                src={previewImagen}
                className="w-32 h-32 object-cover rounded-xl border border-[#2a3d5a]"
              />
              <button
                onClick={() => {
                  setImagen(null);
                  setPreviewImagen("");
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-[#1e2d45] bg-[#090d1a] p-4 flex items-end gap-3">
          <label className="cursor-pointer w-11 h-11 rounded-xl bg-[#111827] border border-[#1e2d45] hover:border-cyan-400 flex items-center justify-center text-xl">
            📎
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImagen(file);
                  setPreviewImagen(URL.createObjectURL(file));
                }
              }}
            />
          </label>

          <div className="flex-1 bg-[#111827] border border-[#1e2d45] focus-within:border-cyan-400 rounded-2xl px-4 py-2 flex items-center">
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviarSMS();
                }
              }}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-transparent outline-none resize-none h-8 text-sm"
            />
            <span className="text-[10px] text-slate-600 font-mono">
              {160 - mensaje.length}
            </span>
          </div>

          <button
            onClick={enviarSMS}
            disabled={(!mensaje.trim() && !imagen) || !chatActivo}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-400 disabled:from-slate-800 disabled:to-slate-700 flex items-center justify-center text-xl font-black"
          >
            ➤
          </button>
        </div>

        <div className="px-6 py-2 border-t border-[#1e2d45] bg-[#090d1a] text-[10px] text-slate-600 font-mono flex gap-5">
          <span>● SMS activo</span>
          <span>● Voz lista</span>
          <span>Telnyx · Zynkora</span>
          <span className="ml-auto">{estado}</span>
        </div>
      </section>
    </main>
  );
}
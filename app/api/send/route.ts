import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const messagesPath = path.join(process.cwd(), "app/data/messages.json");
const numbersPath = path.join(process.cwd(), "app/data/numbers.json");
const assignmentsPath = path.join(
  process.cwd(),
  "app/data/numberAssignments.json"
);

function leerJSON(filePath: string, fallback: any) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
      return fallback;
    }

    const contenido = fs.readFileSync(filePath, "utf8");

    if (!contenido.trim()) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
      return fallback;
    }

    return JSON.parse(contenido);
  } catch (error) {
    console.log("ERROR LEYENDO JSON:", filePath, error);
    return fallback;
  }
}

function guardarJSON(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function normalizarNumero(numero: string) {
  if (!numero) return "";

  const limpio = numero.replace(/[^\d+]/g, "");

  if (limpio.startsWith("+")) return limpio;

  if (limpio.length === 10) return `+1${limpio}`;

  if (limpio.length === 11 && limpio.startsWith("1")) {
    return `+${limpio}`;
  }

  return limpio;
}

function elegirNumeroParaContacto(contactoOriginal: string) {
  const contact = normalizarNumero(contactoOriginal);

  const numbers: string[] = leerJSON(numbersPath, []);
  const assignments: any[] = leerJSON(assignmentsPath, []);

  if (!numbers.length) {
    const fallback = process.env.TELNYX_FROM_NUMBER;

    if (!fallback) {
      throw new Error(
        "No hay números en app/data/numbers.json y TELNYX_FROM_NUMBER no existe."
      );
    }

    return {
      contact,
      assignedNumber: fallback,
    };
  }

  const yaAsignado = assignments.find(
    (item) => item.contact === contact
  );

  if (yaAsignado?.assignedNumber) {
    return {
      contact,
      assignedNumber: yaAsignado.assignedNumber,
    };
  }

  const usage: Record<string, number> = {};

  numbers.forEach((number) => {
    usage[number] = assignments.filter(
      (item) => item.assignedNumber === number
    ).length;
  });

  const assignedNumber = [...numbers].sort(
    (a, b) => usage[a] - usage[b]
  )[0];

  assignments.push({
    contact,
    assignedNumber,
    createdAt: new Date().toISOString(),
  });

  guardarJSON(assignmentsPath, assignments);

  return {
    contact,
    assignedNumber,
  };
}

function actualizarStatus(messageId: string, status: string) {
  try {
    const mensajes = leerJSON(messagesPath, []);

    const actualizados = mensajes.map((msg: any) => {
      if (msg.messageId === messageId || msg.id === messageId) {
        return {
          ...msg,
          status,
          deliveryStatus: status,
          statusUpdatedAt: new Date().toISOString(),
        };
      }

      return msg;
    });

    guardarJSON(messagesPath, actualizados);
  } catch (error) {
    console.log("ERROR ACTUALIZANDO STATUS:", error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const to = normalizarNumero(body.to);
    const { assignedNumber } = elegirNumeroParaContacto(to);

    const payload: any = {
      from: assignedNumber,
      to,
      text: body.message || "",
    };

    if (body.mediaUrl) {
      payload.media_urls = [body.mediaUrl];
      console.log("MMS URL ENVIADA A TELNYX:", body.mediaUrl);
    }

    console.log("PAYLOAD TELNYX:", payload);

    const response = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log("TELNYX RESPONSE:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.log("TELNYX ERROR:", JSON.stringify(data, null, 2));

      return NextResponse.json({
        success: false,
        error: data,
      });
    }

    const messageId = data?.data?.id || `${Date.now()}`;

    const mensajesActuales = leerJSON(messagesPath, []);

    mensajesActuales.push({
      id: messageId,
      messageId,
      from: assignedNumber,
      to,
      message: body.message || "",
      mediaUrl: body.mediaUrl || null,
      direction: "outbound",
      status: "sending",
      deliveryStatus: "sending",
      senderNumber: assignedNumber,
      createdAt: new Date().toISOString(),
    });

    guardarJSON(messagesPath, mensajesActuales);

    setTimeout(() => {
      actualizarStatus(messageId, "sent");
    }, 2000);

    setTimeout(() => {
      actualizarStatus(messageId, "delivered");
    }, 6000);

    return NextResponse.json({
      success: true,
      data,
      messageId,
      from: assignedNumber,
      to,
    });
  } catch (error: any) {
    console.log("SERVER ERROR:", error);

    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
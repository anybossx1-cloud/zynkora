import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

function normalizarNumero(numero: string) {
  if (!numero) return "";

  const limpio = numero.replace(/[^\d+]/g, "");

  if (limpio.startsWith("+")) return limpio;
  if (limpio.length === 10) return `+1${limpio}`;
  if (limpio.length === 11 && limpio.startsWith("1")) return `+${limpio}`;

  return limpio;
}

async function elegirNumeroParaContacto(contactoOriginal: string) {
  const contact = normalizarNumero(contactoOriginal);

  const { data: asignado } = await supabase
    .from("number_assignments")
    .select("*")
    .eq("contact", contact)
    .maybeSingle();

  if (asignado?.assigned_number) {
    return { contact, assignedNumber: asignado.assigned_number };
  }

  const { data: numbers } = await supabase
    .from("numbers")
    .select("*")
    .eq("status", "active");

  if (!numbers || numbers.length === 0) {
    const fallback = process.env.TELNYX_FROM_NUMBER;
    if (!fallback) throw new Error("No hay números activos.");
    return { contact, assignedNumber: fallback };
  }

  const { data: assignments } = await supabase
    .from("number_assignments")
    .select("*");

  const usage: Record<string, number> = {};

  numbers.forEach((n: any) => {
    usage[n.phone] = (assignments || []).filter(
      (a: any) => a.assigned_number === n.phone
    ).length;
  });

  const assignedNumber = [...numbers].sort(
    (a: any, b: any) => usage[a.phone] - usage[b.phone]
  )[0].phone;

  await supabase.from("number_assignments").insert([
    {
      contact,
      assigned_number: assignedNumber,
    },
  ]);

  return { contact, assignedNumber };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const to = normalizarNumero(body.to);
    const { assignedNumber } = await elegirNumeroParaContacto(to);

    const payload: any = {
      from: assignedNumber,
      to,
      text: body.message || "",
    };

    if (body.mediaUrl) {
      payload.media_urls = [body.mediaUrl];
    }

    const response = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ success: false, error: data });
    }

    const messageId = data?.data?.id || `${Date.now()}`;

    const { error: insertError } = await supabase.from("messages").insert([
      {
        message_id: messageId,
        phone: to,
        from_number: assignedNumber,
        to_number: to,
        message: body.message || "",
        media_url: body.mediaUrl || null,
        direction: "outbound",
        status: "delivered",
        delivery_status: "delivered",
        sender_number: assignedNumber,
      },
    ]);

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: insertError.message,
      });
    }

    return NextResponse.json({
      success: true,
      data,
      messageId,
      from: assignedNumber,
      to,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("INBOUND TELNYX:", JSON.stringify(body, null, 2));

    const data = body.data?.payload;

    const from = data?.from?.phone_number || "unknown";
    const to = data?.to?.[0]?.phone_number || "unknown";
    const text = data?.text || "";

    let mediaUrl = null;

    if (data?.media && data.media.length > 0) {
      mediaUrl = data.media[0].url || null;
    }

    if (data?.media_urls && data.media_urls.length > 0) {
      mediaUrl = data.media_urls[0] || mediaUrl;
    }

    const messageId = data?.id || `${Date.now()}`;

    const { error } = await supabase.from("messages").insert([
      {
        message_id: messageId,
        phone: from,
        from_number: from,
        to_number: to,
        message: text,
        media_url: mediaUrl,
        direction: "inbound",
        status: "received",
        delivery_status: "received",
      },
    ]);

    if (error) {
      console.log("SUPABASE INBOUND ERROR:", error);

      return NextResponse.json({
        success: false,
        error: error.message,
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.log("INBOUND ERROR:", error);

    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
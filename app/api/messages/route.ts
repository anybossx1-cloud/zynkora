import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      });
    }

    const messages = (data || []).map((msg: any) => ({
      id: msg.id,
      messageId: msg.message_id || msg.id,
      from: msg.from_number || msg.phone,
      to: msg.to_number || msg.phone,
      message: msg.message,
      mediaUrl: msg.media_url || null,
      direction: msg.direction,
      status: msg.status || "delivered",
      deliveryStatus: msg.delivery_status || msg.status || "delivered",
      createdAt: msg.created_at,
    }));

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
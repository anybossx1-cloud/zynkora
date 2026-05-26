import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("STATUS TELNYX:", JSON.stringify(body, null, 2));

    const eventType = body.data?.event_type || "";
    const payload = body.data?.payload || {};

    const messageId =
      payload?.id ||
      payload?.message_id ||
      payload?.record_id ||
      "";

    const telnyxStatus =
      payload?.to?.[0]?.status ||
      payload?.delivery_status ||
      payload?.status ||
      eventType;

    let finalStatus = "sent";

    if (
      telnyxStatus?.includes("delivered") ||
      eventType?.includes("delivered")
    ) {
      finalStatus = "delivered";
    } else if (
      telnyxStatus?.includes("failed") ||
      telnyxStatus?.includes("undelivered") ||
      eventType?.includes("failed")
    ) {
      finalStatus = "failed";
    } else if (
      telnyxStatus?.includes("sent") ||
      eventType?.includes("sent")
    ) {
      finalStatus = "sent";
    } else {
      finalStatus = telnyxStatus || "sent";
    }

    const filePath = path.join(
      process.cwd(),
      "app/data/messages.json"
    );

    const mensajes = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

    const nuevosMensajes = mensajes.map((msg: any) => {
      const sameMessage =
        msg.messageId === messageId ||
        msg.id === messageId;

      if (sameMessage && msg.direction === "outbound") {
        return {
          ...msg,
          deliveryStatus: finalStatus,
          status: finalStatus,
          statusUpdatedAt: new Date().toISOString(),
        };
      }

      return msg;
    });

    fs.writeFileSync(
      filePath,
      JSON.stringify(nuevosMensajes, null, 2)
    );

    return NextResponse.json({
      success: true,
      messageId,
      status: finalStatus,
    });
  } catch (error: any) {
    console.log("STATUS WEBHOOK ERROR:", error);

    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
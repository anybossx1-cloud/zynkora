import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log(
      "INBOUND TELNYX:",
      JSON.stringify(body, null, 2)
    );

    const data = body.data?.payload;

    const from =
      data?.from?.phone_number || "unknown";

    const to =
      data?.to?.[0]?.phone_number || "unknown";

    const text = data?.text || "";

    let mediaUrl = null;

    // MMS / FOTOS
    if (data?.media && data.media.length > 0) {
      mediaUrl = data.media[0].url || null;
    }

    if (
      data?.media_urls &&
      data.media_urls.length > 0
    ) {
      mediaUrl =
        data.media_urls[0] || mediaUrl;
    }

    const filePath = path.join(
      process.cwd(),
      "app/data/messages.json"
    );

    const mensajesActuales = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

    mensajesActuales.push({
      id: data?.id || "",
      messageId: data?.id || "",
      from,
      to,
      message: text,
      mediaUrl,
      direction: "inbound",
      read: false,
      createdAt: new Date().toISOString(),
    });

    fs.writeFileSync(
      filePath,
      JSON.stringify(mensajesActuales, null, 2)
    );

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
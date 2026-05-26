import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = body.phone;

    const filePath = path.join(process.cwd(), "app/data/messages.json");

    const messages = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const updated = messages.map((msg: any) => {
      const numero =
        msg.direction === "inbound" ? msg.from : msg.to;

      if (numero === phone && msg.direction === "inbound") {
        return {
          ...msg,
          read: true,
        };
      }

      return msg;
    });

    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
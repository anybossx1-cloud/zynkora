import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "app/data/calls.json"
    );

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "[]");
    }

    const calls = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

    return NextResponse.json(calls);
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const filePath = path.join(
      process.cwd(),
      "app/data/calls.json"
    );

    const calls = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

    calls.unshift({
      id: Date.now(),
      number: body.number,
      type: body.type,
      duration: body.duration || "00:00",
      createdAt: new Date().toISOString(),
    });

    fs.writeFileSync(
      filePath,
      JSON.stringify(calls, null, 2)
    );

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
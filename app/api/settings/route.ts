import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(
  process.cwd(),
  "app/data/settings.json"
);

export async function GET() {
  try {
    const settings = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

    return NextResponse.json(settings);
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

    fs.writeFileSync(
      filePath,
      JSON.stringify(body, null, 2)
    );

    return NextResponse.json({
      success: true,
      settings: body,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
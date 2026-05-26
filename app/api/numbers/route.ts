import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "app/data/numbers.json");

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "[]");
    }

    const numbers = JSON.parse(fs.readFileSync(filePath, "utf8"));

    return NextResponse.json(numbers);
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
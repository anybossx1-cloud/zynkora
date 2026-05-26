import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "app/data/contacts.json");

export async function GET() {
  const contacts = JSON.parse(fs.readFileSync(filePath, "utf8"));

  return NextResponse.json({
    success: true,
    contacts,
  });
}

export async function POST(req: Request) {
  const body = await req.json();

  const contacts = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const exists = contacts.find((c: any) => c.phone === body.phone);

  if (exists) {
    exists.name = body.name;
  } else {
    contacts.push({
      phone: body.phone,
      name: body.name,
      createdAt: new Date().toISOString(),
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(contacts, null, 2));

  return NextResponse.json({
    success: true,
    contacts,
  });
}
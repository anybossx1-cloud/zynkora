import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const usersPath = path.join(process.cwd(), "app/data/users.json");

function leerUsuarios() {
  if (!fs.existsSync(usersPath)) {
    fs.writeFileSync(usersPath, "[]");
  }

  const contenido = fs.readFileSync(usersPath, "utf8");

  if (!contenido.trim()) {
    return [];
  }

  return JSON.parse(contenido);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();

    const users = leerUsuarios();

    const user = users.find((u: any) => {
      return (
        String(u.email || "").toLowerCase() === email &&
        String(u.password || "") === password &&
        u.status === "active"
      );
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "Credenciales incorrectas",
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
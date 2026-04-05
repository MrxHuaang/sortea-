"use server";

import { cookies } from "next/headers";
import { createHash } from "crypto";

function getSessionHash() {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  return createHash("sha256").update(adminPassword).digest("hex");
}

export async function verifyPassword(password: string): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  
  if (password === adminPassword) {
    const sessionValue = getSessionHash();
    const cookieStore = await cookies();
    
    cookieStore.set("admin_session", sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    
    return true;
  }
  
  return false;
}

export async function checkAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");
    const expectedValue = getSessionHash();
    
    return session?.value === expectedValue;
  } catch (e) {
    return false;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
}

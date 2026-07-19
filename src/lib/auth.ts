import "server-only";

import { randomBytes, createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";

const sessionDays = 30;

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  role: string;
};

function cookieName() {
  return process.env.SESSION_COOKIE_NAME ?? "tidy_pleats_ops_session";
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export async function signIn(username: string, password: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return null;
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt,
    },
  });

  (await cookies()).set(cookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
  };
}

export async function signOut() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName())?.value;

  if (token) {
    await getPrisma().session.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }

  cookieStore.delete(cookieName());
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(cookieName())?.value;

  if (!token) {
    return null;
  }

  const session = await getPrisma().session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  if (!safeEqual(session.tokenHash, hashToken(token))) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    username: session.user.username,
    role: session.user.role,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

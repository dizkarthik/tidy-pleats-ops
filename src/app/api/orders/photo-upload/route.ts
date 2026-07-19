import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireUser();

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "Blob storage is not configured." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Photo file is required." }, { status: 400 });
  }

  const extension = file.type === "image/png" ? "png" : "jpg";
  const blob = await put(
    `orders/${crypto.randomUUID()}.${extension}`,
    file,
    {
      access: "public",
      token,
    },
  );

  return NextResponse.json({ url: blob.url });
}


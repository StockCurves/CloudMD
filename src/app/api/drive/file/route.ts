import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDriveFileContent } from "@/lib/drive/google";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const accessToken = session?.accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in with your Google Account." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "Missing fileId parameter" }, { status: 400 });
    }

    const fileData = await getDriveFileContent(accessToken, fileId);
    return NextResponse.json(fileData);
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("API /api/drive/file error:", error);
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}

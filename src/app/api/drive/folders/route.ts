import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listFolderItems, searchDriveFolders } from "@/lib/drive/google";

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
    const mode = searchParams.get("mode"); // "list" | "search"
    const folderId = searchParams.get("folderId") || "root";
    const query = searchParams.get("q") || "";

    if (mode === "search") {
      const folders = await searchDriveFolders(accessToken, query);
      return NextResponse.json({ folders });
    }

    const items = await listFolderItems(accessToken, folderId);
    return NextResponse.json({ items, folderId });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("API /api/drive/folders error:", error);
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}

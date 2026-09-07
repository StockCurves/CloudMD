import { DriveItem, DriveFolderSearchItem } from "./types";

const GOOGLE_DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";

/**
 * List files and subfolders in a specific Google Drive folder (Lazy Loading)
 */
export async function listFolderItems(
  accessToken: string,
  folderId: string = "root"
): Promise<DriveItem[]> {
  // Sanitize folderId: if "demo" or invalid string, default to "root"
  const safeFolderId = (!folderId || folderId === "demo" || folderId.trim() === "") ? "root" : folderId;

  // Query: in parent folder, not trashed, and is either a folder or a markdown / text file
  const query = `'${safeFolderId}' in parents and trashed = false and (mimeType = 'application/vnd.google-apps.folder' or name contains '.md' or mimeType = 'text/markdown' or mimeType = 'text/plain')`;

  const params = new URLSearchParams({
    q: query,
    fields: "files(id, name, mimeType, size, modifiedTime)",
    orderBy: "folder,name",
    pageSize: "100",
  });

  const response = await fetch(`${GOOGLE_DRIVE_API_BASE}/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetail = errorText;
    try {
      const errJson = JSON.parse(errorText);
      errorDetail = errJson.error?.message || errorText;
    } catch {
      // raw text
    }
    throw new Error(`Google Drive API (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();
  const rawFiles = data.files || [];

  const items: DriveItem[] = rawFiles.map((file: {
    id: string;
    name: string;
    mimeType: string;
    size?: string;
    modifiedTime?: string;
  }) => {
    const isFolder = file.mimeType === "application/vnd.google-apps.folder";
    return {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      isFolder,
      size: file.size,
      modifiedTime: file.modifiedTime,
      children: isFolder ? [] : undefined,
      hasChildrenLoaded: false,
    };
  });

  // Sort folders first, then files alphabetically (case-insensitive)
  return items.sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

/**
 * Search folders in Google Drive so user can pick their Obsidian Vault
 */
export async function searchDriveFolders(
  accessToken: string,
  searchQuery: string = ""
): Promise<DriveFolderSearchItem[]> {
  let query = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
  if (searchQuery.trim()) {
    const sanitized = searchQuery.replace(/'/g, "\\'");
    query += ` and name contains '${sanitized}'`;
  }

  const params = new URLSearchParams({
    q: query,
    fields: "files(id, name, modifiedTime, parents)",
    orderBy: "modifiedTime desc,name",
    pageSize: "50",
  });

  const response = await fetch(`${GOOGLE_DRIVE_API_BASE}/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetail = errorText;
    try {
      const errJson = JSON.parse(errorText);
      errorDetail = errJson.error?.message || errorText;
    } catch {
      // raw text
    }
    throw new Error(`Google Drive folder search failed: ${errorDetail}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Fetch metadata of a specific Google Drive item (file or folder)
 */
export async function getDriveItemInfo(
  accessToken: string,
  itemId: string
): Promise<{ id: string; name: string; mimeType: string; isFolder: boolean; parents?: string[] }> {
  const safeId = itemId === "root" ? "root" : itemId;
  const res = await fetch(
    `${GOOGLE_DRIVE_API_BASE}/files/${safeId}?fields=id,name,mimeType,parents`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive API (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    name: data.name || "Untitled",
    mimeType: data.mimeType || "",
    isFolder: data.mimeType === "application/vnd.google-apps.folder",
    parents: data.parents,
  };
}

/**
 * Fetch raw markdown content of a file from Google Drive
 */
export async function getDriveFileContent(
  accessToken: string,
  fileId: string
): Promise<{ content: string; name: string; modifiedTime?: string }> {
  // First get metadata (name, mimeType)
  const metaRes = await fetch(
    `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?fields=id,name,mimeType,modifiedTime`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  let fileName = "Untitled.md";
  let mimeType = "";
  let modifiedTime: string | undefined;
  if (metaRes.ok) {
    const meta = await metaRes.json();
    fileName = meta.name || fileName;
    mimeType = meta.mimeType || "";
    modifiedTime = meta.modifiedTime;
  }

  let contentUrl = `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?alt=media`;
  if (mimeType === "application/vnd.google-apps.document") {
    contentUrl = `${GOOGLE_DRIVE_API_BASE}/files/${fileId}/export?mimeType=text/plain`;
  }

  // Get content
  const contentRes = await fetch(contentUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!contentRes.ok) {
    const err = await contentRes.text();
    let errorDetail = err;
    try {
      const errJson = JSON.parse(err);
      errorDetail = errJson.error?.message || err;
    } catch {
      // raw text
    }
    throw new Error(`Failed to fetch file content (${contentRes.status}): ${errorDetail}`);
  }

  const content = await contentRes.text();
  return {
    content,
    name: fileName,
    modifiedTime,
  };
}

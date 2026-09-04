import { DriveItem, DriveFolderSearchItem } from "./types";

const GOOGLE_DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";

/**
 * List files and subfolders in a specific Google Drive folder (Lazy Loading)
 */
export async function listFolderItems(
  accessToken: string,
  folderId: string = "root"
): Promise<DriveItem[]> {
  // Query: in parent folder, not trashed, and is either a folder or a markdown / text file
  const query = `'${folderId}' in parents and trashed = false and (mimeType = 'application/vnd.google-apps.folder' or name contains '.md' or mimeType = 'text/markdown' or mimeType = 'text/plain')`;

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
    throw new Error(`Google Drive API error (${response.status}): ${errorText}`);
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
    pageSize: "25",
  });

  const response = await fetch(`${GOOGLE_DRIVE_API_BASE}/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive folder search failed: ${errorText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Fetch raw markdown content of a file from Google Drive
 */
export async function getDriveFileContent(
  accessToken: string,
  fileId: string
): Promise<{ content: string; name: string; modifiedTime?: string }> {
  // First get metadata (name)
  const metaRes = await fetch(
    `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?fields=id,name,modifiedTime`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  let fileName = "Untitled.md";
  let modifiedTime: string | undefined;
  if (metaRes.ok) {
    const meta = await metaRes.json();
    fileName = meta.name || fileName;
    modifiedTime = meta.modifiedTime;
  }

  // Get raw content
  const contentRes = await fetch(`${GOOGLE_DRIVE_API_BASE}/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!contentRes.ok) {
    const err = await contentRes.text();
    throw new Error(`Failed to fetch file content (${contentRes.status}): ${err}`);
  }

  const content = await contentRes.text();
  return {
    content,
    name: fileName,
    modifiedTime,
  };
}

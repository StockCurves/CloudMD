export type ParsedDriveTarget =
  | { type: "drive-folder"; folderId: string }
  | { type: "drive-file"; fileId: string }
  | { type: "drive-ambiguous"; id: string }
  | { type: "relative"; path: string }
  | { type: "anchor"; hash: string }
  | { type: "external"; url: string };

/**
 * Parses any link href attribute from markdown content to determine
 * whether it points to a Google Drive folder, file, relative path, or external URL.
 */
export function parseDriveLink(rawHref: string): ParsedDriveTarget {
  if (!rawHref) {
    return { type: "relative", path: "" };
  }

  const href = rawHref.trim();

  // 1. In-page anchor hash
  if (href.startsWith("#")) {
    return { type: "anchor", hash: href };
  }

  // 2. Google Drive / Google Docs URLs
  try {
    if (href.startsWith("http://") || href.startsWith("https://")) {
      const url = new URL(href);
      const hostname = url.hostname.toLowerCase();

      // Check if it's a drive.google.com or docs.google.com URL
      if (hostname === "drive.google.com" || hostname.endsWith(".drive.google.com")) {
        const pathname = url.pathname;

        // Folder match: /drive/folders/{id} or /drive/u/{n}/folders/{id}
        const folderMatch = pathname.match(/\/folders\/([a-zA-Z0-9_-]+)/);
        if (folderMatch) {
          return { type: "drive-folder", folderId: folderMatch[1] };
        }

        // File match: /file/d/{id}
        const fileMatch = pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileMatch) {
          return { type: "drive-file", fileId: fileMatch[1] };
        }

        // Check query params: /open?id={id} or ?id={id}
        const idParam = url.searchParams.get("id");
        if (idParam) {
          // Could be a file or a folder ID
          return { type: "drive-ambiguous", id: idParam };
        }

        // Check /drive/folders/ or other drive link
        const folderParam = url.searchParams.get("folderId");
        if (folderParam) {
          return { type: "drive-folder", folderId: folderParam };
        }

        return { type: "external", url: href };
      }

      if (hostname === "docs.google.com" || hostname.endsWith(".docs.google.com")) {
        const pathname = url.pathname;
        const docMatch = pathname.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
        if (docMatch) {
          return { type: "drive-file", fileId: docMatch[1] };
        }
      }

      // Other external web links
      return { type: "external", url: href };
    }
  } catch {
    // If URL parsing fails, treat as relative or fallback
  }

  // 3. Mailto, tel, javascript: etc
  if (/^[a-zA-Z0-9+.-]+:/.test(href)) {
    return { type: "external", url: href };
  }

  // 4. Relative paths or folder/file names
  return { type: "relative", path: decodeURIComponent(href) };
}

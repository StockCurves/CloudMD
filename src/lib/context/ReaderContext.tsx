"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useTransition } from "react";
import { DriveItem, VaultConfig, DriveFolderInfo } from "@/lib/drive/types";
import { parseDriveLink } from "@/lib/drive/url";
import { DEMO_VAULT_ITEMS, DemoFileItem } from "@/lib/demo/sample-vault";
import { renderMarkdown } from "@/lib/markdown/pipeline";
import { FrontmatterData, MarkdownHeading } from "@/lib/markdown/types";

// Helper to find file in demo items
function findDemoFile(items: DemoFileItem[], fileId: string): DemoFileItem | null {
  for (const item of items) {
    if (item.id === fileId) return item;
    if (item.children) {
      const found = findDemoFile(item.children, fileId);
      if (found) return found;
    }
  }
  return null;
}

// Helper to find file by name in demo items (for wikilinks)
function findDemoFileByName(items: DemoFileItem[], name: string): DemoFileItem | null {
  const cleanName = name.toLowerCase().replace(/\.md$/, "");
  for (const item of items) {
    const itemClean = item.name.toLowerCase().replace(/\.md$/, "");
    if (itemClean === cleanName) return item;
    if (item.children) {
      const found = findDemoFileByName(item.children, name);
      if (found) return found;
    }
  }
  return null;
}

// Helper to recursively find file in DriveItem tree
function findItemInTree(items: DriveItem[], name: string): DriveItem | null {
  const cleanName = name.toLowerCase().replace(/\.md$/, "");
  for (const item of items) {
    const itemClean = item.name.toLowerCase().replace(/\.md$/, "");
    if (itemClean === cleanName && !item.isFolder) return item;
    if (item.children) {
      const found = findItemInTree(item.children, name);
      if (found) return found;
    }
  }
  return null;
}

function applyTheme(t: "light" | "dark" | "system") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (t === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", prefersDark ? "dark" : "light");
  } else {
    root.setAttribute("data-theme", t);
  }
}

interface ReaderContextType {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  vaultMode: "demo" | "google";
  setVaultMode: (mode: "demo" | "google") => void;
  currentVault: VaultConfig | null;
  setCurrentVault: (vault: VaultConfig | null) => void;
  isInitialized: boolean;
  fileTree: DriveItem[];
  currentFile: DriveItem | null;
  fileContent: string;
  renderedHtml: string;
  frontmatter: FrontmatterData;
  headings: MarkdownHeading[];
  isLoadingContent: boolean;
  isLoadingTree: boolean;
  treeError: string | null;
  searchFilter: string;
  setSearchFilter: (filter: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isVaultModalOpen: boolean;
  setIsVaultModalOpen: (open: boolean) => void;
  expandedFolderIds: Set<string>;
  selectFile: (file: DriveItem) => Promise<void>;
  toggleFolder: (folder: DriveItem) => Promise<void>;
  navigateToWikilink: (targetName: string, heading?: string) => Promise<boolean>;
  navigateToDriveFolder: (
    folderId: string,
    folderNameHint?: string
  ) => Promise<{ success: boolean; message?: string }>;
  navigateToFileById: (
    fileId: string,
    fileNameHint?: string
  ) => Promise<{ success: boolean; message?: string }>;
  navigateToLinkTarget: (
    href: string,
    linkText?: string
  ) => Promise<{ handled: boolean; message?: string }>;
  refreshFileTree: (targetVault?: VaultConfig | null, signal?: AbortSignal) => Promise<void>;
  activeHeadingId: string;
  setActiveHeadingId: (id: string) => void;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 1
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (options.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      const res = await fetch(url, options);
      return res;
    } catch (err: unknown) {
      lastError = err;
      if (err instanceof Error && err.name === "AbortError") {
        throw err;
      }
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
  }
  throw lastError;
}

function formatDriveErrorMessage(err: unknown, status?: number): string {
  if (status === 401) {
    return "Google 帳號尚未登入或授權已逾期，請重新登入 Google 帳號";
  }
  if (status === 403) {
    return "存取權限不足或 Google Drive API 配額受限";
  }
  if (status === 404) {
    return "找不到指定的 Google Drive 資料夾，可能已被移動或移除";
  }
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    return "無法連線至伺服器或網路連線不穩定，請稍後再試";
  }
  return msg;
}

const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

export function ReaderProvider({
  children,
  sessionAccessToken,
}: {
  children: React.ReactNode;
  sessionAccessToken?: string;
}) {
  const [theme, setThemeState] = useState<"light" | "dark" | "system">(() => {
    if (typeof window === "undefined") return "system";
    const rawTheme =
      localStorage.getItem("cloudmd-theme") ||
      localStorage.getItem("md-reader-theme");
    if (rawTheme === "light" || rawTheme === "dark" || rawTheme === "system") {
      return rawTheme;
    }
    return "system";
  });
  const [vaultMode, setVaultMode] = useState<"demo" | "google">(
    sessionAccessToken ? "google" : "demo"
  );
  const [currentVault, setCurrentVaultState] = useState<VaultConfig | null>(null);
  const currentVaultRef = useRef<VaultConfig | null>(currentVault);
  useEffect(() => {
    currentVaultRef.current = currentVault;
  }, [currentVault]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState<boolean>(false);
  const [fileTree, setFileTree] = useState<DriveItem[]>([]);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());
  const [currentFile, setCurrentFile] = useState<DriveItem | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [renderedHtml, setRenderedHtml] = useState<string>("");
  const [frontmatter, setFrontmatter] = useState<FrontmatterData>({});
  const [headings, setHeadings] = useState<MarkdownHeading[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
  const [isLoadingTree, setIsLoadingTree] = useState<boolean>(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string>("");
  const [, startTransition] = useTransition();

  // Apply theme to DOM
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (t: "light" | "dark" | "system") => {
    setThemeState(t);
    localStorage.setItem("cloudmd-theme", t);
    applyTheme(t);
  };

  // Process markdown text and update rendering state
  const loadAndRenderMarkdown = useCallback(async (content: string) => {
    setIsLoadingContent(true);
    try {
      const result = await renderMarkdown(content);
      startTransition(() => {
        setFileContent(content);
        setRenderedHtml(result.html);
        setFrontmatter(result.frontmatter);
        setHeadings(result.headings);
      });
    } catch (err) {
      console.error("Failed to render markdown:", err);
      setRenderedHtml(`<p style="color: red;">Error rendering markdown: ${String(err)}</p>`);
    } finally {
      setIsLoadingContent(false);
    }
  }, []);

  // Select and view a file
  const selectFile = useCallback(
    async (file: DriveItem) => {
      if (file.isFolder) return;
      setCurrentFile(file);
      setIsSidebarOpen(false); // Auto close mobile sidebar on select

      if (vaultMode === "demo") {
        const demoItem = findDemoFile(DEMO_VAULT_ITEMS, file.id);
        if (demoItem && demoItem.content !== undefined) {
          await loadAndRenderMarkdown(demoItem.content);
        }
        return;
      }

      // Fetch from Google Drive API
      setIsLoadingContent(true);
      try {
        const res = await fetchWithRetry(`/api/drive/file?fileId=${file.id}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to load file (${res.status})`);
        }
        const data = await res.json();
        await loadAndRenderMarkdown(data.content || "");
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        const displayErr = formatDriveErrorMessage(err);
        console.error("Error fetching file content:", displayErr);
        setRenderedHtml(`<div class="render-error" style="padding: 2rem; color: var(--color-danger-fg);">
          <h3>無法載入檔案內容</h3>
          <p style="margin-top: 0.5rem; color: var(--color-fg-muted);">${displayErr}</p>
        </div>`);
      } finally {
        setIsLoadingContent(false);
      }
    },
    [vaultMode, loadAndRenderMarkdown]
  );

  // Lazy load folder children and toggle expanded state
  const toggleFolder = useCallback(
    async (folder: DriveItem) => {
      if (!folder.isFolder) return;

      setExpandedFolderIds((prev) => {
        const next = new Set(prev);
        if (next.has(folder.id)) {
          next.delete(folder.id);
        } else {
          next.add(folder.id);
        }
        return next;
      });

      if (vaultMode === "demo") {
        return;
      }

      if (folder.hasChildrenLoaded) return;

      const updateTreeChildren = (
        items: DriveItem[],
        targetId: string,
        newChildren: DriveItem[]
      ): DriveItem[] => {
        return items.map((item) => {
          if (item.id === targetId) {
            return {
              ...item,
              children: newChildren,
              hasChildrenLoaded: true,
              isLoading: false,
            };
          }
          if (item.children) {
            return {
              ...item,
              children: updateTreeChildren(item.children, targetId, newChildren),
            };
          }
          return item;
        });
      };

      setFileTree((prev) =>
        prev.map((item) => (item.id === folder.id ? { ...item, isLoading: true } : item))
      );

      try {
        const res = await fetchWithRetry(`/api/drive/folders?folderId=${folder.id}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setFileTree((prev) => updateTreeChildren(prev, folder.id, data.items || []));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Failed to load folder children:", err);
        setFileTree((prev) =>
          prev.map((item) => (item.id === folder.id ? { ...item, isLoading: false } : item))
        );
      }
    },
    [vaultMode]
  );

  // Load root items for current vault
  const refreshFileTree = useCallback(
    async (targetVault?: VaultConfig | null, signal?: AbortSignal) => {
      setTreeError(null);
      const activeVault = targetVault !== undefined ? targetVault : currentVaultRef.current;

      if (vaultMode === "demo") {
        setFileTree(DEMO_VAULT_ITEMS);
        setCurrentFile((curr) => {
          if (!curr && DEMO_VAULT_ITEMS.length > 0) {
            selectFile(DEMO_VAULT_ITEMS[0]);
          }
          return curr;
        });
        return;
      }

      // If in Google mode, NEVER query root by default if user hasn't selected a vault
      if (!activeVault || activeVault.provider !== "google" || !activeVault.rootFolderId) {
        setFileTree([]);
        setIsLoadingTree(false);
        return;
      }

      // If in Google mode but no session, do not fire unauthorized network call
      if (!sessionAccessToken) {
        setFileTree([]);
        setTreeError("請先登入 Google 帳號以存取雲端硬碟檔案");
        setIsLoadingTree(false);
        return;
      }

      const folderId = activeVault.rootFolderId;
      setIsLoadingTree(true);
      try {
        const res = await fetchWithRetry(`/api/drive/folders?folderId=${folderId}`, { signal });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error || `HTTP ${res.status}`;
          throw new Error(errMsg);
        }
        const data = await res.json();
        const items: DriveItem[] = data.items || [];
        setFileTree(items);

        setCurrentFile((curr) => {
          if (!curr) {
            const firstMd = items.find((it) => !it.isFolder);
            if (firstMd) {
              selectFile(firstMd);
            }
          }
          return curr;
        });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        const msg = formatDriveErrorMessage(err);
        console.error("Failed to load drive files:", msg);
        setTreeError(msg);
      } finally {
        if (!signal?.aborted) {
          setIsLoadingTree(false);
        }
      }
    },
    [vaultMode, sessionAccessToken, selectFile]
  );

  // Navigate to wikilink note in vault
  const navigateToWikilink = useCallback(
    async (targetName: string, heading?: string): Promise<boolean> => {
      let matchedFile: DriveItem | null = null;

      if (vaultMode === "demo") {
        matchedFile = findDemoFileByName(DEMO_VAULT_ITEMS, targetName);
      } else {
        matchedFile = findItemInTree(fileTree, targetName);
      }

      if (matchedFile) {
        await selectFile(matchedFile);
        if (heading) {
          setTimeout(() => {
            const anchorId = heading
              .toLowerCase()
              .replace(/[^\w\s\u4e00-\u9fa5-]/g, "")
              .replace(/\s+/g, "-");
            const element = document.getElementById(anchorId);
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            }
          }, 300);
        }
        return true;
      }
      return false;
    },
    [vaultMode, fileTree, selectFile]
  );

  // Navigate directly to a Drive file by its ID
  const navigateToFileById = useCallback(
    async (
      fileId: string,
      fileNameHint?: string
    ): Promise<{ success: boolean; message?: string }> => {
      try {
        const fileItem: DriveItem = {
          id: fileId,
          name: fileNameHint || "筆記檔案",
          mimeType: "text/markdown",
          isFolder: false,
        };
        await selectFile(fileItem);
        return { success: true };
      } catch (err) {
        console.error("Failed to navigate to file by ID:", err);
        return { success: false, message: `無法開啟檔案：${formatDriveErrorMessage(err)}` };
      }
    },
    [selectFile]
  );

  // Navigate and expand a Drive folder, and automatically open its first markdown note
  const navigateToDriveFolder = useCallback(
    async (
      folderId: string,
      folderNameHint?: string
    ): Promise<{ success: boolean; message?: string }> => {
      if (vaultMode === "demo") {
        const findDemoFolder = (items: DemoFileItem[], idOrName: string): DemoFileItem | null => {
          for (const item of items) {
            if (
              item.isFolder &&
              (item.id === idOrName || item.name.toLowerCase() === idOrName.toLowerCase())
            ) {
              return item;
            }
            if (item.children) {
              const found = findDemoFolder(item.children, idOrName);
              if (found) return found;
            }
          }
          return null;
        };

        const demoFolder =
          findDemoFolder(DEMO_VAULT_ITEMS, folderId) ||
          (folderNameHint ? findDemoFolder(DEMO_VAULT_ITEMS, folderNameHint) : null);

        if (demoFolder) {
          setExpandedFolderIds((prev) => new Set([...prev, demoFolder.id]));
          const firstMd = demoFolder.children?.find(
            (c) => !c.isFolder && c.name.toLowerCase().endsWith(".md")
          );
          if (firstMd) {
            await selectFile(firstMd);
            return {
              success: true,
              message: `已展開目錄「${demoFolder.name}」並開啟 ${firstMd.name}`,
            };
          }
          return { success: true, message: `已展開目錄「${demoFolder.name}」` };
        }
        return { success: false, message: "找不到指定的目錄" };
      }

      // Google Drive Mode
      setIsLoadingContent(true);
      try {
        const res = await fetchWithRetry(`/api/drive/folders?folderId=${folderId}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        const items: DriveItem[] = data.items || [];
        const folderInfo = data.folderInfo as DriveFolderInfo | null;
        const displayName = folderInfo?.name || folderNameHint || "資料夾";

        // Expand target folder ID (and parents if present)
        setExpandedFolderIds((prev) => {
          const next = new Set(prev);
          next.add(folderId);
          if (folderInfo?.parents) {
            folderInfo.parents.forEach((p) => next.add(p));
          }
          return next;
        });

        // Update fileTree with new children
        setFileTree((prevTree) => {
          let found = false;
          const updateRecursive = (list: DriveItem[]): DriveItem[] => {
            return list.map((item) => {
              if (item.id === folderId) {
                found = true;
                return {
                  ...item,
                  children: items,
                  hasChildrenLoaded: true,
                  isLoading: false,
                };
              }
              if (item.children) {
                return {
                  ...item,
                  children: updateRecursive(item.children),
                };
              }
              return item;
            });
          };

          const updated = updateRecursive(prevTree);
          if (!found) {
            // If the folder was not in the current top level, append as loaded folder
            const newFolderItem: DriveItem = {
              id: folderId,
              name: displayName,
              mimeType: "application/vnd.google-apps.folder",
              isFolder: true,
              children: items,
              hasChildrenLoaded: true,
              isLoading: false,
            };
            return [...prevTree, newFolderItem];
          }
          return updated;
        });

        // Find first markdown file in this folder to open automatically
        const isMarkdown = (it: DriveItem) =>
          !it.isFolder &&
          (it.name.toLowerCase().endsWith(".md") ||
            it.mimeType === "text/markdown" ||
            it.mimeType === "text/plain");

        const preferredMd =
          items.find((it) => isMarkdown(it) && /^(readme|index|toc)\.md$/i.test(it.name)) ||
          items.find(isMarkdown);

        if (preferredMd) {
          await selectFile(preferredMd);
          return {
            success: true,
            message: `已展開目錄「${displayName}」並開啟 ${preferredMd.name}`,
          };
        } else {
          return {
            success: true,
            message: `已展開目錄「${displayName}」（此目錄下尚無 Markdown 檔案）`,
          };
        }
      } catch (err) {
        console.error("Failed to navigate to folder:", err);
        return {
          success: false,
          message: `無法開啟目錄：${formatDriveErrorMessage(err)}`,
        };
      } finally {
        setIsLoadingContent(false);
      }
    },
    [vaultMode, selectFile]
  );

  // Navigate to any link target (Google Drive folder/file, relative path, or anchor)
  const navigateToLinkTarget = useCallback(
    async (
      href: string,
      linkText?: string
    ): Promise<{ handled: boolean; message?: string }> => {
      const parsed = parseDriveLink(href);

      if (parsed.type === "anchor") {
        const id = parsed.hash.replace(/^#/, "");
        const element = document.getElementById(id) || document.querySelector(parsed.hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
          return { handled: true };
        }
        return { handled: false };
      }

      if (parsed.type === "drive-folder") {
        const result = await navigateToDriveFolder(parsed.folderId, linkText);
        return { handled: true, message: result.message };
      }

      if (parsed.type === "drive-file") {
        const result = await navigateToFileById(parsed.fileId, linkText);
        return { handled: true, message: result.message };
      }

      if (parsed.type === "drive-ambiguous") {
        // Try as folder first; if it returns empty items or errors, try as file
        const folderRes = await navigateToDriveFolder(parsed.id, linkText);
        if (folderRes.success) {
          return { handled: true, message: folderRes.message };
        }
        const fileRes = await navigateToFileById(parsed.id, linkText);
        return { handled: true, message: fileRes.message };
      }

      if (parsed.type === "relative") {
        const path = parsed.path.trim();
        if (!path) return { handled: false };

        const cleanName = path.replace(/^\.\//, "").replace(/\/$/, "");

        // Try wikilink style navigation first
        const wikiSuccess = await navigateToWikilink(cleanName);
        if (wikiSuccess) {
          return { handled: true };
        }

        // Try searching for folder in tree or demo vault
        const findFolderByNameOrId = (items: DriveItem[], name: string): DriveItem | null => {
          const lower = name.toLowerCase();
          for (const item of items) {
            if (item.isFolder && (item.name.toLowerCase() === lower || item.id === name || item.id.toLowerCase() === lower)) {
              return item;
            }
            if (item.children) {
              const found = findFolderByNameOrId(item.children, name);
              if (found) return found;
            }
          }
          return null;
        };

        const targetList = vaultMode === "demo" ? DEMO_VAULT_ITEMS : fileTree;
        const targetFolder = findFolderByNameOrId(targetList, cleanName);
        if (targetFolder) {
          const res = await navigateToDriveFolder(targetFolder.id, targetFolder.name);
          return { handled: true, message: res.message };
        }

        return { handled: false, message: `找不到筆記或目錄「${cleanName}」` };
      }

      return { handled: false };
    },
    [navigateToDriveFolder, navigateToFileById, navigateToWikilink, fileTree]
  );

  // Synchronize vaultMode with session status
  useEffect(() => {
    startTransition(() => {
      if (sessionAccessToken && vaultMode === "demo") {
        setVaultMode("google");
      } else if (!sessionAccessToken && vaultMode === "google") {
        setVaultMode("demo");
      }
    });
  }, [sessionAccessToken, vaultMode]);

  // Initialize vault on mode change
  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const init = async () => {
      if (vaultMode === "demo") {
        if (!ignore) {
          setIsInitialized(true);
        }
        await refreshFileTree(undefined, controller.signal);
        return;
      }

      // Google mode: check if saved vault exists in localStorage
      const savedVault = localStorage.getItem("cloudmd-vault") || localStorage.getItem("md-reader-vault");
      if (savedVault) {
        try {
          const parsed = JSON.parse(savedVault);
          if (parsed.provider === "google" && parsed.rootFolderId) {
            if (!ignore) {
              if (
                currentVaultRef.current?.rootFolderId !== parsed.rootFolderId ||
                currentVaultRef.current?.provider !== parsed.provider
              ) {
                setCurrentVaultState(parsed);
              }
              setIsInitialized(true);
              if (!sessionAccessToken) {
                setFileTree([]);
                setTreeError("請先登入 Google 帳號以存取雲端硬碟筆記庫");
                return;
              }
              await refreshFileTree(parsed, controller.signal);
              return;
            }
          }
        } catch {
          // ignore JSON parse error
        }
      }

      // If no saved vault in google mode, do not auto-load root
      if (!ignore) {
        setFileTree([]);
        setIsInitialized(true);
      }
    };

    init();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [vaultMode, sessionAccessToken, refreshFileTree]);

  const setCurrentVault = (vault: VaultConfig | null) => {
    setCurrentVaultState(vault);
    if (vault) {
      localStorage.setItem("cloudmd-vault", JSON.stringify(vault));
      refreshFileTree(vault);
    } else {
      localStorage.removeItem("cloudmd-vault");
      setFileTree([]);
    }
  };

  return (
    <ReaderContext.Provider
      value={{
        theme,
        setTheme,
        vaultMode,
        setVaultMode,
        currentVault,
        setCurrentVault,
        isInitialized,
        fileTree,
        currentFile,
        fileContent,
        renderedHtml,
        frontmatter,
        headings,
        isLoadingContent,
        isLoadingTree,
        treeError,
        searchFilter,
        setSearchFilter,
        isSidebarOpen,
        setIsSidebarOpen,
        isVaultModalOpen,
        setIsVaultModalOpen,
        expandedFolderIds,
        selectFile,
        toggleFolder,
        navigateToWikilink,
        navigateToDriveFolder,
        navigateToFileById,
        navigateToLinkTarget,
        refreshFileTree,
        activeHeadingId,
        setActiveHeadingId,
      }}
    >
      {children}
    </ReaderContext.Provider>
  );
}

export function useReader() {
  const context = useContext(ReaderContext);
  if (!context) {
    throw new Error("useReader must be used within a ReaderProvider");
  }
  return context;
}

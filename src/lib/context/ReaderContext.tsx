"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useTransition } from "react";
import { DriveItem, VaultConfig } from "@/lib/drive/types";
import { DEMO_VAULT_ITEMS, DemoFileItem } from "@/lib/demo/sample-vault";
import { renderMarkdown } from "@/lib/markdown/pipeline";
import { FrontmatterData, MarkdownHeading } from "@/lib/markdown/types";

interface ReaderContextType {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  vaultMode: "demo" | "google";
  setVaultMode: (mode: "demo" | "google") => void;
  currentVault: VaultConfig | null;
  setCurrentVault: (vault: VaultConfig | null) => void;
  fileTree: DriveItem[];
  currentFile: DriveItem | null;
  fileContent: string;
  renderedHtml: string;
  frontmatter: FrontmatterData;
  headings: MarkdownHeading[];
  isLoadingContent: boolean;
  isLoadingTree: boolean;
  searchFilter: string;
  setSearchFilter: (filter: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  selectFile: (file: DriveItem) => Promise<void>;
  toggleFolder: (folder: DriveItem) => Promise<void>;
  navigateToWikilink: (targetName: string, heading?: string) => Promise<boolean>;
  refreshFileTree: () => Promise<void>;
  activeHeadingId: string;
  setActiveHeadingId: (id: string) => void;
}

const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

export function ReaderProvider({
  children,
  sessionAccessToken,
}: {
  children: React.ReactNode;
  sessionAccessToken?: string;
}) {
  const [theme, setThemeState] = useState<"light" | "dark" | "system">("system");
  const [vaultMode, setVaultMode] = useState<"demo" | "google">(
    sessionAccessToken ? "google" : "demo"
  );
  const [currentVault, setCurrentVaultState] = useState<VaultConfig | null>(null);
  const [fileTree, setFileTree] = useState<DriveItem[]>([]);
  const [currentFile, setCurrentFile] = useState<DriveItem | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [renderedHtml, setRenderedHtml] = useState<string>("");
  const [frontmatter, setFrontmatter] = useState<FrontmatterData>({});
  const [headings, setHeadings] = useState<MarkdownHeading[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
  const [isLoadingTree, setIsLoadingTree] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string>("");
  const [, startTransition] = useTransition();

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = (localStorage.getItem("md-reader-theme") as "light" | "dark" | "system") || "system";
    setThemeState(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (t: "light" | "dark" | "system") => {
    const root = document.documentElement;
    if (t === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      root.setAttribute("data-theme", t);
    }
  };

  const setTheme = (t: "light" | "dark" | "system") => {
    setThemeState(t);
    localStorage.setItem("md-reader-theme", t);
    applyTheme(t);
  };

  // Helper to find file in demo items
  const findDemoFile = useCallback((items: DemoFileItem[], fileId: string): DemoFileItem | null => {
    for (const item of items) {
      if (item.id === fileId) return item;
      if (item.children) {
        const found = findDemoFile(item.children, fileId);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Helper to find file by name in demo items (for wikilinks)
  const findDemoFileByName = useCallback(
    (items: DemoFileItem[], name: string): DemoFileItem | null => {
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
    },
    []
  );

  // Helper to recursively find file in DriveItem tree
  const findItemInTree = useCallback((items: DriveItem[], name: string): DriveItem | null => {
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
  }, []);

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
        const res = await fetch(`/api/drive/file?fileId=${file.id}`);
        if (!res.ok) {
          throw new Error(`Failed to load file (${res.status})`);
        }
        const data = await res.json();
        await loadAndRenderMarkdown(data.content || "");
      } catch (err) {
        console.error("Error fetching file content:", err);
        setRenderedHtml(`<div class="render-error">
          <h3>無法載入檔案內容</h3>
          <p>${err instanceof Error ? err.message : String(err)}</p>
        </div>`);
      } finally {
        setIsLoadingContent(false);
      }
    },
    [vaultMode, findDemoFile, loadAndRenderMarkdown]
  );

  // Lazy load folder children
  const toggleFolder = useCallback(
    async (folder: DriveItem) => {
      if (!folder.isFolder) return;

      // Update tree recursively
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

      // If in demo mode, children are already loaded
      if (vaultMode === "demo") {
        return;
      }

      // If already loaded, toggle could just collapse/expand handled by UI state
      if (folder.hasChildrenLoaded) return;

      // Mark folder as loading in tree
      setFileTree((prev) =>
        prev.map((item) => (item.id === folder.id ? { ...item, isLoading: true } : item))
      );

      try {
        const res = await fetch(`/api/drive/folders?folderId=${folder.id}`);
        if (!res.ok) throw new Error("Failed to load folder");
        const data = await res.json();
        setFileTree((prev) => updateTreeChildren(prev, folder.id, data.items || []));
      } catch (err) {
        console.error("Failed to load folder children:", err);
        setFileTree((prev) =>
          prev.map((item) => (item.id === folder.id ? { ...item, isLoading: false } : item))
        );
      }
    },
    [vaultMode]
  );

  // Load root items for current vault
  const refreshFileTree = useCallback(async () => {
    if (vaultMode === "demo") {
      setFileTree(DEMO_VAULT_ITEMS);
      // Auto select first file if none selected
      if (!currentFile && DEMO_VAULT_ITEMS.length > 0) {
        selectFile(DEMO_VAULT_ITEMS[0]);
      }
      return;
    }

    const folderId = currentVault?.rootFolderId || "root";
    setIsLoadingTree(true);
    try {
      const res = await fetch(`/api/drive/folders?folderId=${folderId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: DriveItem[] = data.items || [];
      setFileTree(items);

      // Auto select first markdown file if found
      const firstMd = items.find((it) => !it.isFolder);
      if (firstMd && !currentFile) {
        selectFile(firstMd);
      }
    } catch (err) {
      console.error("Failed to load drive files:", err);
    } finally {
      setIsLoadingTree(false);
    }
  }, [vaultMode, currentVault, currentFile, selectFile]);

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
    [vaultMode, fileTree, findDemoFileByName, findItemInTree, selectFile]
  );

  // Initialize vault on mode or session change
  useEffect(() => {
    const savedVault = localStorage.getItem("md-reader-vault");
    if (savedVault) {
      try {
        setCurrentVaultState(JSON.parse(savedVault));
      } catch {
        // ignore JSON parse error
      }
    }
    refreshFileTree();
  }, [vaultMode, refreshFileTree]);

  const setCurrentVault = (vault: VaultConfig | null) => {
    setCurrentVaultState(vault);
    if (vault) {
      localStorage.setItem("md-reader-vault", JSON.stringify(vault));
    } else {
      localStorage.removeItem("md-reader-vault");
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
        fileTree,
        currentFile,
        fileContent,
        renderedHtml,
        frontmatter,
        headings,
        isLoadingContent,
        isLoadingTree,
        searchFilter,
        setSearchFilter,
        isSidebarOpen,
        setIsSidebarOpen,
        selectFile,
        toggleFolder,
        navigateToWikilink,
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

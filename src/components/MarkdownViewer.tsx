"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import styles from "./MarkdownViewer.module.css";
import { useReader } from "@/lib/context/ReaderContext";
import { parseDriveLink } from "@/lib/drive/url";
import { ChevronRight, Tag, Calendar, User, ChevronDown, ChevronUp } from "lucide-react";
import mermaid from "mermaid";

export const MarkdownViewer: React.FC = () => {
  const {
    currentFile,
    renderedHtml,
    frontmatter,
    headings,
    isLoadingContent,
    navigateToWikilink,
    navigateToLinkTarget,
    currentVault,
    vaultMode,
    theme,
    setIsVaultModalOpen,
  } = useReader();

  const articleRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFrontmatterOpen, setIsFrontmatterOpen] = useState<boolean>(true);
  const [, startTransition] = useTransition();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      startTransition(() => {
        setToastMessage(null);
      });
    }, 3000);
  };

  // Initialize Mermaid with appropriate theme
  useEffect(() => {
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? "dark" : "default",
      securityLevel: "loose",
      fontFamily: "var(--font-sans)",
    });
  }, [theme]);

  // Run Mermaid after HTML renders
  useEffect(() => {
    if (!renderedHtml || !articleRef.current) return;

    const timer = setTimeout(() => {
      try {
        mermaid.run({
          nodes: document.querySelectorAll(".mermaid"),
        });
      } catch (err) {
        console.warn("Mermaid render error:", err);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [renderedHtml]);

  // Intercept Markdown and Obsidian Wikilink clicks reliably via React event delegation
  const handleLinkClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a") as HTMLAnchorElement | null;
    if (!anchor) return;

    // 1. Obsidian Wikilink
    if (anchor.classList.contains("obsidian-wikilink")) {
      e.preventDefault();
      const rawTarget = anchor.getAttribute("data-wikilink-target");
      const rawHeading = anchor.getAttribute("data-wikilink-heading");

      const targetName = decodeURIComponent(rawTarget || "");
      const heading = decodeURIComponent(rawHeading || "");

      if (targetName) {
        const success = await navigateToWikilink(targetName, heading);
        if (!success) {
          showToast(`筆記「${targetName}」尚未在此 Vault 中建立`);
        }
      }
      return;
    }

    // 2. Standard Links (Google Drive folder/file, relative markdown path, or anchors)
    const href = anchor.getAttribute("href");
    if (!href) return;

    const parsed = parseDriveLink(href);
    if (parsed.type !== "external") {
      // Prevent default navigation immediately before any async await
      e.preventDefault();
      const linkText = anchor.textContent?.trim();
      const res = await navigateToLinkTarget(href, linkText);
      if (res.message) {
        showToast(res.message);
      }
    } else {
      // External link: ensure target="_blank" and rel="noopener noreferrer"
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
    }
  };

  const tagsList = Array.isArray(frontmatter.tags)
    ? frontmatter.tags
    : typeof frontmatter.tags === "string"
    ? frontmatter.tags.split(",").map((t) => t.trim())
    : [];

  return (
    <main className={styles.viewerContainer}>
      {/* Breadcrumb Bar */}
      <div className={styles.breadcrumbBar}>
        <span suppressHydrationWarning>
          {vaultMode === "demo" ? "Demo Vault" : currentVault?.name || "Vault"}
        </span>
        <ChevronRight size={13} />
        <span style={{ color: "var(--color-fg-default)", fontWeight: 500 }}>
          {currentFile ? currentFile.name : "未選取檔案"}
        </span>
      </div>

      {/* Main Content Area */}
      {isLoadingContent ? (
        <div className={styles.emptyState}>
          <div className="spinner-large" />
          <p style={{ marginTop: "1rem" }}>載入筆記內容中...</p>
        </div>
      ) : !currentFile ? (
        vaultMode === "google" && !currentVault ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📁</div>
            <h3>請先選取 Google Drive 筆記庫目錄</h3>
            <p style={{ marginTop: "0.5rem", maxWidth: "420px", lineHeight: "1.6" }}>
              為了避免將整個雲端硬碟全部讀入，請先指定您存放 Markdown 筆記的目錄作為 Vault。
            </p>
            <button
              style={{
                marginTop: "1.25rem",
                padding: "0.5rem 1.25rem",
                backgroundColor: "var(--color-accent-emphasis)",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontWeight: 500,
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
              onClick={() => setIsVaultModalOpen(true)}
            >
              選取 Vault 目錄
            </button>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📖</div>
            <h3>尚未選取筆記</h3>
            <p style={{ marginTop: "0.5rem" }}>
              請由左側檔案樹點選任一 Markdown 筆記開始閱讀。
            </p>
          </div>
        )
      ) : (
        <div className={styles.contentWrapper}>
          <article className={styles.article}>
            {/* Frontmatter Metadata Header */}
            {Object.keys(frontmatter).length > 0 && (
              <div className={styles.frontmatterBox}>
                <div
                  className={styles.frontmatterHeader}
                  onClick={() => setIsFrontmatterOpen(!isFrontmatterOpen)}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Tag size={13} />
                    <span>筆記屬性 (Properties)</span>
                  </span>
                  {isFrontmatterOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>

                {isFrontmatterOpen && (
                  <div style={{ marginTop: "0.5rem" }}>
                    {tagsList.length > 0 && (
                      <div className={styles.frontmatterTags}>
                        {tagsList.map((tag, idx) => (
                          <span key={idx} className={styles.tagPill}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        marginTop: "0.5rem",
                        color: "var(--color-fg-muted)",
                        fontSize: "0.75rem",
                      }}
                    >
                      {frontmatter.date && (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Calendar size={12} />
                          {String(frontmatter.date)}
                        </span>
                      )}
                      {frontmatter.author && (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <User size={12} />
                          {String(frontmatter.author)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Markdown Body */}
            <div
              ref={articleRef}
              className={styles.markdownBody}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
              onClick={handleLinkClick}
            />
          </article>

          {/* Table of Contents (TOC) Sidebar */}
          {headings.length > 1 && (
            <aside className={styles.tocSidebar}>
              <div className={styles.tocTitle}>大綱 (Outline)</div>
              <ul className={styles.tocList}>
                {headings.map((h, i) => (
                  <li
                    key={i}
                    className={styles.tocItem}
                    style={{ paddingLeft: `${(h.depth - 1) * 0.75}rem` }}
                  >
                    <a href={`#${h.id}`} title={h.text}>
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && <div className={styles.toast}>{toastMessage}</div>}
    </main>
  );
};

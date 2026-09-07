"use client";

import React from "react";
import styles from "./Sidebar.module.css";
import { useReader } from "@/lib/context/ReaderContext";
import { FileTreeNode } from "./FileTreeNode";
import { Search, X, Files, AlertCircle, RefreshCw, Sparkles, Folder } from "lucide-react";
import clsx from "clsx";

export const Sidebar: React.FC = () => {
  const {
    fileTree,
    searchFilter,
    setSearchFilter,
    isSidebarOpen,
    setIsSidebarOpen,
    isLoadingTree,
    treeError,
    refreshFileTree,
    setVaultMode,
    vaultMode,
    currentVault,
    setIsVaultModalOpen,
  } = useReader();

  return (
    <>
      {isSidebarOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={clsx(styles.sidebar, isSidebarOpen && styles.sidebarOpen)}>
        <div className={styles.searchContainer}>
          <div className={styles.searchInputWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="搜尋筆記與資料夾..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className={styles.searchInput}
            />
            {searchFilter && (
              <button
                className={styles.clearButton}
                onClick={() => setSearchFilter("")}
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className={styles.treeContainer}>
          <div className={styles.treeHeader}>
            <span>筆記目錄 (Files)</span>
            <Files size={13} />
          </div>

          {treeError ? (
            <div className={styles.errorContainer}>
              <div className={styles.errorTitle}>
                <AlertCircle size={15} />
                <span>載入 Google Drive 失敗</span>
              </div>
              <p className={styles.errorMessage}>{treeError}</p>
              <div className={styles.errorActions}>
                <button
                  className={clsx(styles.errorButton, styles.primaryErrorButton)}
                  onClick={() => refreshFileTree()}
                >
                  <RefreshCw size={12} style={{ display: "inline", marginRight: "4px" }} />
                  重試連線
                </button>
                <button
                  className={styles.errorButton}
                  onClick={() => {
                    setVaultMode("demo");
                    refreshFileTree();
                  }}
                >
                  <Sparkles size={12} style={{ display: "inline", marginRight: "4px" }} />
                  切換回 Demo 範例庫
                </button>
              </div>
            </div>
          ) : isLoadingTree && fileTree.length === 0 ? (
            <div className={styles.emptyTree}>
              <p>載入中...</p>
            </div>
          ) : vaultMode === "google" && !currentVault ? (
            <div className={styles.emptyTree} style={{ padding: "2rem 1rem", textAlign: "center" }}>
              <Folder size={28} style={{ color: "var(--color-accent-fg)", margin: "0 auto 0.75rem auto", display: "block" }} />
              <p style={{ fontWeight: 600, color: "var(--color-fg-default)", marginBottom: "0.25rem" }}>尚未選取筆記庫</p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-fg-muted)", marginBottom: "1rem" }}>
                請指定一個 Google Drive 目錄作為 Vault
              </p>
              <button
                className={clsx(styles.errorButton, styles.primaryErrorButton)}
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => setIsVaultModalOpen(true)}
              >
                選取 Drive 資料夾
              </button>
            </div>
          ) : fileTree.length === 0 ? (
            <div className={styles.emptyTree}>
              <p>此目錄下無 Markdown 檔案</p>
            </div>
          ) : (
            fileTree.map((item) => (
              <FileTreeNode key={item.id} item={item} searchFilter={searchFilter} />
            ))
          )}
        </div>
      </aside>
    </>
  );
};

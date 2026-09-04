"use client";

import React from "react";
import styles from "./Sidebar.module.css";
import { useReader } from "@/lib/context/ReaderContext";
import { FileTreeNode } from "./FileTreeNode";
import { Search, X, Files } from "lucide-react";
import clsx from "clsx";

export const Sidebar: React.FC = () => {
  const {
    fileTree,
    searchFilter,
    setSearchFilter,
    isSidebarOpen,
    setIsSidebarOpen,
    isLoadingTree,
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

          {isLoadingTree && fileTree.length === 0 ? (
            <div className={styles.emptyTree}>
              <p>載入中...</p>
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

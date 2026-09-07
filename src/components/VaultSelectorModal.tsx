"use client";

import React, { useState, useEffect } from "react";
import styles from "./VaultSelectorModal.module.css";
import { useReader } from "@/lib/context/ReaderContext";
import { DriveFolderSearchItem } from "@/lib/drive/types";
import { X, Folder, Sparkles, Cloud, Search, Check } from "lucide-react";
import clsx from "clsx";

interface VaultSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}

export const VaultSelectorModal: React.FC<VaultSelectorModalProps> = ({
  isOpen,
  onClose,
  isLoggedIn,
}) => {
  const { vaultMode, setVaultMode, currentVault, setCurrentVault } = useReader();

  const [searchQuery, setSearchQuery] = useState("");
  const [folders, setFolders] = useState<DriveFolderSearchItem[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);

  // Search Google Drive folders when logged in
  useEffect(() => {
    if (!isOpen || !isLoggedIn) return;

    const controller = new AbortController();
    let isMounted = true;
    const fetchFolders = async () => {
      setIsLoadingFolders(true);
      try {
        const res = await fetch(
          `/api/drive/folders?mode=search&q=${encodeURIComponent(searchQuery)}`,
          { signal: controller.signal }
        );
        if (res.ok && isMounted) {
          const data = await res.json();
          setFolders(data.folders || []);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Error searching drive folders:", err);
      } finally {
        if (isMounted) setIsLoadingFolders(false);
      }
    };

    // If initial open without query, fetch immediately; otherwise debounce
    if (!searchQuery) {
      fetchFolders();
      return () => {
        isMounted = false;
        controller.abort();
      };
    }

    const debounce = setTimeout(fetchFolders, 300);
    return () => {
      isMounted = false;
      clearTimeout(debounce);
      controller.abort();
    };
  }, [isOpen, isLoggedIn, searchQuery]);

  if (!isOpen) return null;

  const selectDemoVault = () => {
    setVaultMode("demo");
    setCurrentVault({
      id: "demo-vault",
      name: "Demo Vault",
      provider: "demo",
      rootFolderId: "demo",
      rootFolderName: "Demo Vault",
    });
    onClose();
  };

  const selectGoogleFolder = (folder: DriveFolderSearchItem) => {
    setVaultMode("google");
    setCurrentVault({
      id: folder.id,
      name: folder.name,
      provider: "google",
      rootFolderId: folder.id,
      rootFolderName: folder.name,
    });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <Folder size={18} />
            <span>選擇筆記庫 (Obsidian Vault)</span>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Demo Vault Option */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>離線範例庫</div>
            <div
              className={clsx(
                styles.vaultOptionCard,
                vaultMode === "demo" && styles.vaultOptionCardActive
              )}
              onClick={selectDemoVault}
            >
              <div className={styles.optionInfo}>
                <Sparkles size={18} color="var(--color-attention-fg)" />
                <div>
                  <div style={{ fontWeight: 500 }}>Demo Vault (內建示範)</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-fg-muted)" }}>
                    包含 Wikilinks、Callouts、KaTeX 與 Mermaid 完整語法示範筆記
                  </div>
                </div>
              </div>
              {vaultMode === "demo" && <Check size={16} color="var(--color-accent-fg)" />}
            </div>
          </div>

          {/* Google Drive Vault Section */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Google Drive 筆記庫</div>
            {!isLoggedIn ? (
              <div
                style={{
                  padding: "1rem",
                  textAlign: "center",
                  backgroundColor: "var(--color-canvas-subtle)",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  color: "var(--color-fg-muted)",
                }}
              >
                <Cloud size={24} style={{ marginBottom: "0.5rem" }} />
                <p>請先登入 Google 帳號以連結你的 Drive 資料夾</p>
              </div>
            ) : (
              <>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="搜尋 Google Drive 資料夾名稱..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                  <Search
                    size={14}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-fg-muted)",
                    }}
                  />
                </div>

                <div className={styles.folderList}>
                  {isLoadingFolders ? (
                    <div style={{ padding: "1rem", textAlign: "center", color: "var(--color-fg-muted)" }}>
                      搜尋中...
                    </div>
                  ) : folders.length === 0 ? (
                    <div style={{ padding: "1rem", textAlign: "center", color: "var(--color-fg-muted)" }}>
                      無符合的資料夾
                    </div>
                  ) : (
                    folders.map((f) => (
                      <div
                        key={f.id}
                        className={styles.folderItem}
                        onClick={() => selectGoogleFolder(f)}
                      >
                        <Folder size={15} color="#54aeff" />
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {f.name}
                        </span>
                        {currentVault?.rootFolderId === f.id && (
                          <Check size={14} color="var(--color-accent-fg)" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={onClose}>
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};

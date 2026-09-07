"use client";

import React from "react";
import styles from "./AppHeader.module.css";
import { useReader } from "@/lib/context/ReaderContext";
import { signIn, signOut } from "next-auth/react";
import {
  FolderKanban,
  Sun,
  Moon,
  Monitor,
  Menu,
  LogIn,
  LogOut,
  RefreshCw,
} from "lucide-react";

interface AppHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  onOpenVaultModal: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ user, onOpenVaultModal }) => {
  const {
    theme,
    setTheme,
    vaultMode,
    currentVault,
    isSidebarOpen,
    setIsSidebarOpen,
    refreshFileTree,
    isLoadingTree,
  } = useReader();

  const cycleTheme = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <button
          className={styles.menuButton}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle Sidebar"
        >
          <Menu size={18} />
        </button>

        <div className={styles.logoArea}>
          <span className={styles.logoIcon}>📑</span>
          <span>CloudMD</span>
        </div>

        <button
          className={styles.vaultBadge}
          onClick={onOpenVaultModal}
          title="切換筆記庫 (Vault)"
        >
          <FolderKanban size={14} />
          <span suppressHydrationWarning>
            {vaultMode === "demo"
              ? "Demo Vault"
              : currentVault?.name || "Google Drive Vault"}
          </span>
          {vaultMode === "demo" && <span className={styles.demoTag}>Demo</span>}
        </button>
      </div>

      <div className={styles.rightSection}>
        <button
          className={styles.iconButton}
          onClick={() => refreshFileTree()}
          disabled={isLoadingTree}
          title="重新整理檔案樹"
        >
          <RefreshCw size={14} className={isLoadingTree ? "spin-animation" : ""} />
        </button>

        <button
          className={styles.iconButton}
          onClick={cycleTheme}
          title={`主題：${theme === "system" ? "跟隨系統" : theme === "dark" ? "深色" : "淺色"}`}
          suppressHydrationWarning
        >
          {theme === "system" ? (
            <Monitor size={15} />
          ) : theme === "dark" ? (
            <Moon size={15} />
          ) : (
            <Sun size={15} />
          )}
        </button>

        {user ? (
          <div className={styles.userProfile}>
            {user.image && (
              <img
                src={user.image}
                alt={user.name || "User"}
                className={styles.userAvatar}
              />
            )}
            <button
              className={styles.iconButton}
              onClick={() => signOut()}
              title="登出 Google"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            className={styles.loginButton}
            onClick={() => signIn("google")}
            title="登入 Google 帳號以讀取個人 Drive 筆記庫"
          >
            <LogIn size={14} />
            <span>連線 Google Drive</span>
          </button>
        )}
      </div>
    </header>
  );
};

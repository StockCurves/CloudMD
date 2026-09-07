"use client";

import React, { useEffect } from "react";
import styles from "@/app/page.module.css";
import { AppHeader } from "@/components/AppHeader";
import { Sidebar } from "@/components/Sidebar";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { VaultSelectorModal } from "@/components/VaultSelectorModal";
import { useReader } from "@/lib/context/ReaderContext";

interface MainAppViewProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export const MainAppView: React.FC<MainAppViewProps> = ({ user }) => {
  const { isVaultModalOpen, setIsVaultModalOpen, currentVault, vaultMode, isInitialized } = useReader();

  useEffect(() => {
    // If logged in to Google and no Google vault chosen yet, prompt user to select folder
    if (isInitialized && user && vaultMode === "google" && !currentVault) {
      setIsVaultModalOpen(true);
    }
  }, [isInitialized, user, vaultMode, currentVault, setIsVaultModalOpen]);

  return (
    <div className={styles.appLayout}>
      <AppHeader user={user} onOpenVaultModal={() => setIsVaultModalOpen(true)} />
      <div className={styles.mainContainer}>
        <Sidebar />
        <MarkdownViewer />
      </div>

      <VaultSelectorModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        isLoggedIn={!!user}
      />
    </div>
  );
};


"use client";

import React, { useState } from "react";
import styles from "@/app/page.module.css";
import { AppHeader } from "@/components/AppHeader";
import { Sidebar } from "@/components/Sidebar";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { VaultSelectorModal } from "@/components/VaultSelectorModal";

interface MainAppViewProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export const MainAppView: React.FC<MainAppViewProps> = ({ user }) => {
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);

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

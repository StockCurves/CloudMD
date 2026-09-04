"use client";

import React, { useState } from "react";
import styles from "./FileTreeNode.module.css";
import { DriveItem } from "@/lib/drive/types";
import { useReader } from "@/lib/context/ReaderContext";
import { ChevronRight, Folder, FolderOpen, FileText } from "lucide-react";
import clsx from "clsx";

interface FileTreeNodeProps {
  item: DriveItem;
  searchFilter: string;
}

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({ item, searchFilter }) => {
  const { currentFile, selectFile, toggleFolder } = useReader();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const isSelected = currentFile?.id === item.id;
  const isMatch =
    searchFilter &&
    item.name.toLowerCase().includes(searchFilter.toLowerCase().trim());

  // Function to render highlighted matched text
  const renderHighlightedName = (name: string, filter: string) => {
    if (!filter) return name;
    const parts = name.split(new RegExp(`(${filter})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === filter.toLowerCase() ? (
        <mark key={index} className={styles.highlightMatch}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleClick = async () => {
    if (item.isFolder) {
      const nextOpen = !isOpen;
      setIsOpen(nextOpen);
      if (nextOpen && !item.hasChildrenLoaded) {
        await toggleFolder(item);
      }
    } else {
      await selectFile(item);
    }
  };

  return (
    <div className={styles.nodeContainer}>
      <div
        className={clsx(styles.itemRow, isSelected && styles.activeRow)}
        onClick={handleClick}
        title={item.name}
      >
        {item.isFolder ? (
          <>
            <span className={clsx(styles.chevron, isOpen && styles.chevronOpen)}>
              <ChevronRight size={14} />
            </span>
            <span className={clsx(styles.icon, styles.folderIcon)}>
              {isOpen ? <FolderOpen size={16} /> : <Folder size={16} />}
            </span>
          </>
        ) : (
          <>
            <span style={{ width: 14 }} />
            <span className={styles.icon}>
              <FileText size={15} />
            </span>
          </>
        )}

        <span className={styles.nameText}>
          {renderHighlightedName(item.name, searchFilter)}
        </span>

        {item.isLoading && <span className={styles.spinner} />}
      </div>

      {item.isFolder && (isOpen || searchFilter) && item.children && (
        <div className={styles.childrenContainer}>
          {item.children.map((child) => (
            <FileTreeNode key={child.id} item={child} searchFilter={searchFilter} />
          ))}
        </div>
      )}
    </div>
  );
};

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  size?: string;
  modifiedTime?: string;
  children?: DriveItem[];
  hasChildrenLoaded?: boolean;
  isLoading?: boolean;
}

export interface DriveFolderSearchItem {
  id: string;
  name: string;
  modifiedTime?: string;
  parents?: string[];
}

export interface DriveFolderInfo {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  parents?: string[];
}

export interface VaultConfig {
  id: string;
  name: string;
  provider: "google" | "onedrive" | "demo";
  rootFolderId: string;
  rootFolderName: string;
}

export interface FileContentResponse {
  id: string;
  name: string;
  content: string;
  mimeType?: string;
  modifiedTime?: string;
}

/**
 * @file: FolderIcon.tsx
 * @description: Компонент для отображения shadcn/ui иконок папок
 * @dependencies: lucide-react
 * @created: 2025-10-21
 */

import React from 'react';
import {
  Folder,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  File,
  FileText,
  FilePlus,
  FileMinus,
  Bookmark,
  Tag,
  Pin,
  Link,
  Zap,
  Archive,
  Inbox,
  Briefcase,
} from 'lucide-react';

interface FolderIconProps {
  iconName: string;
  size?: number;
  className?: string;
}

const iconMap = {
  folder: Folder,
  'folder-open': FolderOpen,
  'folder-plus': FolderPlus,
  'folder-minus': FolderMinus,
  file: File,
  'file-text': FileText,
  'file-plus': FilePlus,
  'file-minus': FileMinus,
  bookmark: Bookmark,
  tag: Tag,
  pin: Pin,
  link: Link,
  zap: Zap,
  archive: Archive,
  inbox: Inbox,
  briefcase: Briefcase,
};

export const FolderIcon: React.FC<FolderIconProps> = ({
  iconName,
  size = 16,
  className = '',
}) => {
  const IconComponent = iconMap[iconName as keyof typeof iconMap] || Folder;

  return <IconComponent size={size} className={className} />;
};

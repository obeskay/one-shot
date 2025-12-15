import React from 'react';
import { Folder, FolderOpen, FileCode, FileJson, FileType, FileImage, File } from 'lucide-react';

export const FileIcon: React.FC<{ isDir: boolean, expanded: boolean, name: string }> = ({ isDir, expanded, name }) => {
  if (isDir) {
    return expanded
        ? <FolderOpen size={16} className="text-brand-400 fill-brand-400/20" />
        : <Folder size={16} className="text-gray-500 group-hover:text-brand-400/70 transition-colors" />;
  }

  const ext = name.split('.').pop()?.toLowerCase();

  switch (ext) {
      // TypeScript & JavaScript
      case 'ts':
          return <FileCode size={16} className="text-blue-400" />;
      case 'tsx':
          return <FileCode size={16} className="text-blue-300" />;
      case 'js':
          return <FileCode size={16} className="text-yellow-400" />;
      case 'jsx':
          return <FileCode size={16} className="text-yellow-300" />;

      // Go
      case 'go':
          return <FileCode size={16} className="text-cyan-400" />;

      // Config files
      case 'json':
          return <FileJson size={16} className="text-yellow-500" />;
      case 'yml':
      case 'yaml':
          return <FileJson size={16} className="text-purple-400" />;
      case 'toml':
          return <FileJson size={16} className="text-orange-400" />;

      // Styles
      case 'css':
      case 'scss':
      case 'sass':
          return <FileType size={16} className="text-pink-400" />;

      // Images
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
          return <FileImage size={16} className="text-purple-400" />;
      case 'svg':
          return <FileImage size={16} className="text-orange-400" />;

      // Markdown
      case 'md':
      case 'mdx':
          return <FileType size={16} className="text-blue-300" />;

      // Python
      case 'py':
          return <FileCode size={16} className="text-green-400" />;

      // Rust
      case 'rs':
          return <FileCode size={16} className="text-orange-500" />;

      default:
          return <File size={16} className="text-gray-500" />;
  }
};
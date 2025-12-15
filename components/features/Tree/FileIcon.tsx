import React from 'react';
import { Folder, FolderOpen, FileCode, FileJson, FileType, FileImage } from 'lucide-react';

export const FileIcon: React.FC<{ isDir: boolean, expanded: boolean, name: string }> = ({ isDir, expanded, name }) => {
  if (isDir) {
    return expanded 
        ? <FolderOpen size={16} className="text-brand-400 fill-brand-400/20" /> 
        : <Folder size={16} className="text-gray-500 group-hover:text-brand-400/70 transition-colors" />;
  }
  
  const ext = name.split('.').pop()?.toLowerCase();

  switch (ext) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
          return <FileCode size={16} className="text-accent-400" />;
      case 'css':
      case 'scss':
          return <FileType size={16} className="text-blue-300" />;
      case 'json':
      case 'yml':
          return <FileJson size={16} className="text-yellow-400" />;
      case 'png':
      case 'svg':
          return <FileImage size={16} className="text-purple-400" />;
      case 'go':
          return <FileCode size={16} className="text-cyan-400" />;
      default:
          return <FileCode size={16} className="text-gray-600" />;
  }
};
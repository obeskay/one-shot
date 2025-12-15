import React, { useMemo } from 'react';
import { useStore } from '../contexts/StoreContext';
import { FileNode } from '../types';
import { Folder, FileCode, ChevronRight, ChevronDown } from 'lucide-react';

interface TreeNodeProps {
    node: FileNode;
    depth: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, depth }) => {
    const { state, dispatch } = useStore();
    
    const isExpanded = state.expandedFolderIds.has(node.id);
    const isSelected = state.selectedFileIds.has(node.id);

    const handleToggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.isDir) {
            dispatch({ type: 'TOGGLE_EXPAND', payload: node.id });
        }
    };

    const handleSelect = () => {
        if (!node.isDir) {
            dispatch({ type: 'TOGGLE_SELECT', payload: node.id });
        }
    };

    // Indentation style
    const paddingLeft = `${depth * 1.5}rem`;

    return (
        <div>
            <div 
                className={`
                    flex items-center py-1 pr-2 cursor-pointer border-l-2 text-sm select-none group
                    ${isSelected ? 'bg-blue-900/30 border-blue-500' : 'border-transparent hover:bg-gray-800'}
                `}
                style={{ paddingLeft }}
                onClick={handleSelect}
            >
                <div 
                    className="mr-2 p-1 rounded hover:bg-gray-700 text-gray-400"
                    onClick={handleToggleExpand}
                >
                    {node.isDir ? (
                        isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    ) : <div className="w-[14px]" />}
                </div>

                {node.isDir ? (
                    <Folder size={16} className="text-yellow-500 mr-2" />
                ) : (
                    <FileCode size={16} className="text-blue-400 mr-2" />
                )}

                <span className={`truncate ${isSelected ? 'text-blue-200 font-medium' : 'text-gray-300'}`}>
                    {node.name}
                </span>
                
                {!node.isDir && (
                    <span className="ml-auto text-xs text-gray-600 group-hover:text-gray-500">
                        {Math.ceil(node.size / 1024)}kb
                    </span>
                )}
            </div>

            {node.isDir && isExpanded && node.children && (
                <div>
                    {node.children.map(child => (
                        <TreeNode key={child.id} node={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export const FileTree: React.FC = () => {
    const { state } = useStore();
    const tree = state.tree;

    if (!tree) return <div className="p-8 text-center text-gray-500">No project loaded</div>;

    return (
        <div className="flex-1 overflow-y-auto h-full pb-20">
            <TreeNode node={tree.root} depth={0.5} />
        </div>
    );
};
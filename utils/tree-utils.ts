
import { FileNode } from '../types';

export function getAllFileIds(node: FileNode): string[] {
    let ids: string[] = [];
    if (!node.isDir) {
        ids.push(node.id);
    }
    if (node.children) {
        node.children.forEach(child => {
            ids = ids.concat(getAllFileIds(child));
        });
    }
    return ids;
}

export function filterTree(node: FileNode, query: string): FileNode | null {
    if (!query) return node;
    
    const nameMatches = node.name.toLowerCase().includes(query.toLowerCase());
    
    if (!node.isDir && nameMatches) return node;

    if (node.isDir) {
        const filteredChildren = node.children
            ?.map(child => filterTree(child, query))
            .filter((child): child is FileNode => child !== null);
            
        if (filteredChildren && filteredChildren.length > 0) {
            return { ...node, children: filteredChildren };
        }
        
        // If folder matches query, return it with all children
        if (nameMatches) return node;
    }

    return null;
}

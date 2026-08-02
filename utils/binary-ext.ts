// Extensiones que el backend descarta como binario. Se usan solo para que la
// estimacion previa de tokens no cuente el peso de imagenes y assets.
const BINARY_EXTENSIONS = new Set([
    // imagenes
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'ico', 'icns', 'tiff', 'psd',
    // video y audio
    'mp4', 'mov', 'avi', 'webm', 'mkv', 'mp3', 'wav', 'flac', 'ogg', 'm4a',
    // fuentes
    'woff', 'woff2', 'ttf', 'otf', 'eot',
    // comprimidos y binarios
    'zip', 'gz', 'tar', 'rar', '7z', 'pdf', 'exe', 'dll', 'so', 'dylib',
    'wasm', 'bin', 'dat', 'db', 'sqlite', 'pyc', 'class', 'jar',
]);

export function isLikelyBinary(relPath: string): boolean {
    const ext = relPath.split('.').pop();
    if (!ext || ext === relPath) return false;
    return BINARY_EXTENSIONS.has(ext.toLowerCase());
}

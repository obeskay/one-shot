package fs

import (
	"bytes"
	"os"
	"path/filepath"
	"unicode/utf8"
)

// binarySniffLimit son los bytes que inspeccionamos para decidir si es binario
const binarySniffLimit = 8192

// IsBinary detecta contenido no textual con la heuristica de git:
// un byte NUL en el primer bloque, o demasiados bytes invalidos en UTF-8.
func IsBinary(content []byte) bool {
	sample := content
	if len(sample) > binarySniffLimit {
		sample = sample[:binarySniffLimit]
	}
	if len(sample) == 0 {
		return false
	}

	if bytes.IndexByte(sample, 0) >= 0 {
		return true
	}

	// Contamos runas invalidas: un texto real casi no tiene
	invalid := 0
	for i := 0; i < len(sample); {
		r, size := utf8.DecodeRune(sample[i:])
		if r == utf8.RuneError && size == 1 {
			invalid++
		}
		i += size
	}

	return invalid*100 > len(sample)*10
}

// FileSize retorna el tamano real en disco de un archivo del proyecto
func FileSize(rootPath, relPath string) (int64, error) {
	info, err := os.Stat(filepath.Join(rootPath, relPath))
	if err != nil {
		return 0, err
	}
	return info.Size(), nil
}

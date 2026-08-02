package fs

import "testing"

func TestIsBinary(t *testing.T) {
	cases := []struct {
		name    string
		content []byte
		want    bool
	}{
		{"texto plano", []byte("package main\n\nfunc main() {}\n"), false},
		{"utf8 con acentos", []byte("// configuración del módulo español\n"), false},
		{"vacio", []byte{}, false},
		{"png", []byte{0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0x00}, true},
		{"nul al final del bloque", append([]byte("texto"), 0x00), true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := IsBinary(tc.content); got != tc.want {
				t.Errorf("IsBinary(%q) = %v, esperaba %v", tc.name, got, tc.want)
			}
		})
	}
}

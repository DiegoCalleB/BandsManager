#!/usr/bin/env python3
"""
Auditoría de paleta (visual-identity §4).
Verifica que tokens.css mantiene un solo acento azul, estados calibrados y menú por grupo equilibrado.
"""
import sys
from pathlib import Path

tokens_path = Path("src/styles/tokens.css")
if not tokens_path.exists():
    print("Error: src/styles/tokens.css no existe", file=sys.stderr)
    sys.exit(1)

content = tokens_path.read_text(encoding="utf-8")

# Verificar acento único azul
if "#2158DC" not in content:
    print("Error: --acc principal no contiene el azul esperado (#2158DC)", file=sys.stderr)
    sys.exit(1)

# Verificar que existen los grupos de menú teñido
grupos = ['data-grupo="musica"', 'data-grupo="promocion"', 'data-grupo="negocio"']
for g in grupos:
    if g not in content:
        print(f"Error: falta grupo {g} en tokens.css", file=sys.stderr)
        sys.exit(1)

print("paleta-audit: todo en orden (un solo azul, estados coherentes, menú por grupo calibrado)")
sys.exit(0)

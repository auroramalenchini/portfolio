#!/bin/bash
# Copia las fotos que elegiste en Behance, ya emparejadas con tus originales.
#   1) originales completos  -> AP/FOTOS/SELECCION BEHANCE/<proyecto>/
#   2) versiones para la web -> portfolio/img/foto/<proyecto>/
# Se puede correr de nuevo sin problema: saltea lo que ya está hecho.

PROY="$HOME/Downloads/portfolio"
MAN="$PROY/_seleccion.txt"
DISCO="/Volumes/AP/FOTOS/Laburos"
SEL="/Volumes/AP/FOTOS/SELECCION BEHANCE"

echo "Copiando la selección de Behance."
echo

if [ ! -f "$MAN" ]; then echo "Falta $MAN"; read -n 1 -s -r -p "Enter para cerrar."; exit 1; fi
if [ ! -d "$DISCO" ]; then
  echo "No encuentro el disco AP. Conectalo y volvé a hacer doble clic."
  read -n 1 -s -r -p "Enter para cerrar."; exit 1
fi

n=0
while IFS='|' read -r slug carpeta orden rel; do
  [ -z "$slug" ] && continue
  src="$DISCO/$rel"
  [ -f "$src" ] || { echo "   falta: $rel"; continue; }

  mkdir -p "$SEL/$carpeta" "$PROY/img/foto/$slug"
  base=$(basename "$rel")
  dst="$SEL/$carpeta/$orden - $base"
  [ -f "$dst" ] || cp "$src" "$dst"

  web="$PROY/img/foto/$slug/$orden.jpg"
  if [ ! -f "$web" ]; then
    sips -s format jpeg -Z 1600 "$src" --out "$web" >/dev/null 2>&1
  fi

  n=$((n + 1))
  if [ $((n % 20)) -eq 0 ]; then echo "   $n fotos..."; fi
done < "$MAN"

echo
echo "LISTO. $n fotos copiadas."
echo "  Originales:   $SEL"
echo "  Para la web:  $PROY/img/foto"
echo
read -n 1 -s -r -p "Apretá cualquier tecla para cerrar."

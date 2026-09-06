#!/bin/bash
# Genera una miniatura de 400 px de cada foto del disco AP dentro de
# portfolio/_miniaturas, para poder emparejarlas con las de Behance.
# Se puede correr las veces que haga falta: saltea las que ya existen.

SRC="/Volumes/AP/FOTOS/Laburos"
DST="$HOME/Downloads/portfolio/_miniaturas"

echo "Generando miniaturas. Esto tarda unos minutos, dejalo correr."
echo

if [ ! -d "$SRC" ]; then
  echo "No encuentro el disco AP en $SRC."
  echo "Fijate que esté conectado y volvé a hacer doble clic."
  echo
  read -n 1 -s -r -p "Apretá cualquier tecla para cerrar."
  exit 1
fi

mkdir -p "$DST"
cd "$SRC" || exit 1

find . -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) ! -name '._*' | {
  n=0
  while IFS= read -r f; do
    rel="${f#./}"
    out="$DST/$(printf '%s' "$rel" | tr '/' '~')"
    [ -f "$out" ] || sips -Z 400 "$f" --out "$out" >/dev/null 2>&1
    n=$((n + 1))
    if [ $((n % 100)) -eq 0 ]; then echo "   $n fotos procesadas..."; fi
  done
  echo "   $n fotos procesadas en total."
}

echo
echo "LISTO. Miniaturas generadas: $(ls "$DST" | wc -l | tr -d ' ')"
echo "Avisale a Claude que ya está."
echo
read -n 1 -s -r -p "Apretá cualquier tecla para cerrar esta ventana."

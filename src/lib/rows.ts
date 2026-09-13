// Dónde termina cada fila del mosaico, decidido al publicar.
//
// Todas las filas llenan el ancho: en cada una las fotos crecen en proporción
// a su forma, así que la fila mide de alto (ancho de la columna) / (suma de
// las proporciones). Lo único que hay que elegir es cuántas fotos van en cada
// fila, respetando el orden. Se elige la partición cuyas filas se alejan
// menos del alto buscado, midiendo la distancia como razón (una fila del
// doble de alto pesa lo mismo que una de la mitad).
//
// Es lo que hacía el JavaScript del sitio viejo en el navegador, pero acá se
// calcula una sola vez y para toda la secuencia, así que la última fila no
// queda nunca suelta ni gigante.

/** Los tres mosaicos del sitio. */
export type MosaicLayout = 'foto' | 'proyecto' | 'video';

/** Pantalla ancha (más de 800px) o angosta. */
export type Band = 'wide' | 'narrow';

/**
 * Alto buscado de cada fila, como fracción del ancho de la columna.
 * - foto, ancho: 0,44 deja la apaisada 16:9 sola y las de 3:2 de a dos, como
 *   el sitio viejo (la primera de Oruga mide 533px en la columna de 948).
 * - video, ancho: 0,26 pone los fotogramas de a dos.
 * - angosto: altos parecidos a los que ya tenía el teléfono; los fotogramas
 *   van de a uno.
 */
export const ROW_TARGET: Record<MosaicLayout, Record<Band, number>> = {
  foto: { wide: 0.44, narrow: 0.55 },
  proyecto: { wide: 0.41, narrow: 0.65 },
  video: { wide: 0.26, narrow: 0.56 },
};

/** Más de esto en una fila ya no se lee como fila. */
export const MAX_PER_ROW = 8;

/**
 * Parte una secuencia de proporciones (ancho / alto) en filas.
 * Devuelve cuántas fotos lleva cada fila, en orden: [2, 3, 2] son tres filas.
 * El espacio entre fotos se desprecia: con 8px contra columnas de 330 a
 * 1300px no cambia la elección.
 */
export function partitionRows(ratios: number[], target: number, maxPerRow = MAX_PER_ROW): number[] {
  const n = ratios.length;
  if (n === 0) return [];
  if (!(target > 0)) throw new Error(`alto buscado inválido: ${target}`);

  // best[j]: menor costo para acomodar las primeras j fotos; from[j]: dónde
  // empieza la última fila de esa solución.
  const best = new Array<number>(n + 1).fill(Infinity);
  const from = new Array<number>(n + 1).fill(-1);
  best[0] = 0;

  for (let j = 1; j <= n; j++) {
    let sum = 0;
    for (let i = j - 1; i >= 0 && j - i <= maxPerRow; i--) {
      const r = ratios[i];
      if (!(r > 0)) throw new Error(`proporción inválida en la posición ${i}: ${r}`);
      sum += r;
      const cost = best[i] + Math.log(1 / sum / target) ** 2;
      if (cost < best[j]) {
        best[j] = cost;
        from[j] = i;
      }
    }
  }

  const counts: number[] = [];
  for (let j = n; j > 0; j = from[j]) counts.unshift(j - from[j]);
  return counts;
}

/**
 * Índices de las fotos que cierran una fila, salvo la última del mosaico:
 * ahí va el corte de línea.
 */
export function rowEnds(counts: number[]): Set<number> {
  const ends = new Set<number>();
  let i = -1;
  counts.slice(0, -1).forEach((c) => ends.add((i += c)));
  return ends;
}

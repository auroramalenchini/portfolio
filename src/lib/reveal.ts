// Aparición al entrar en pantalla: lo que lleva .reveal entra con una
// opacidad y una escala muy leves.
//
// Con movimiento reducido esto no hace absolutamente nada, y no hace falta:
// la regla que esconde los elementos vive dentro de un
// @media (prefers-reduced-motion: no-preference), así que quien pidió menos
// movimiento —o quien no tiene JavaScript— ve el contenido de entrada.

/** Escalón entre hermanos que entran juntos. */
const PASO = 90;
/** Tope: ningún elemento espera más que esto desde que entró en pantalla. */
const TOPE = 300;
/** Lo que tarda la transición más larga, para limpiar el retardo después. */
const LIMPIEZA = 1300;

export function iniciarReveal(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const todos = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
  if (!todos.length) return;

  if (!('IntersectionObserver' in window)) {
    for (const el of todos) el.classList.add('in');
    return;
  }

  const io = new IntersectionObserver(
    (entradas) => {
      // Los que entran en la misma tanda se escalonan entre ellos. El tope
      // está para que nada quede invisible casi un segundo: con ocho
      // elementos en pantalla, el octavo esperaría 630 ms sin él.
      const entrando = entradas.filter((e) => e.isIntersecting);
      entrando.forEach((entrada, i) => {
        const el = entrada.target as HTMLElement;
        el.style.transitionDelay = `${Math.min(i * PASO, TOPE)}ms`;
        el.classList.add('in');
        io.unobserve(el);
        // El retardo era sólo para la entrada: si queda, el hover se siente
        // pegajoso.
        window.setTimeout(() => {
          el.style.transitionDelay = '';
        }, LIMPIEZA);
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
  );

  for (const el of todos) io.observe(el);
}

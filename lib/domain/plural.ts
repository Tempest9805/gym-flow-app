/**
 * Contar cosas en espanol sin que se lea a maquina.
 *
 * "1 rutinas" es la clase de detalle que hace que una app parezca a medio
 * hacer. Estaba en cinco sitios distintos, cada uno con su ternario, asi que
 * vive aqui y se prueba una vez.
 *
 * El cero va en plural, que es lo correcto en espanol: "0 rutinas".
 */
export function pluralize(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

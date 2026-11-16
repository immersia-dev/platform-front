/**
 * Concordância numérica simples para textos de contagem:
 * `pluralize(1, 'módulo liberado', 'módulos liberados')` -> "1 módulo liberado".
 */
export function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Só a palavra, para frases em que o número aparece em outro elemento. */
export function pluralWord(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

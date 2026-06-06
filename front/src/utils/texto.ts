/**
 * Helpers de manipulação de texto em português.
 */

/**
 * Conectores em português que ficam minúsculos no meio de uma frase em Title Case.
 * Quando aparecem como primeira palavra, ainda devem ficar capitalizados.
 */
const CONECTORES_MINUSCULOS = new Set([
  "de",
  "do",
  "da",
  "dos",
  "das",
  "e",
  "ou",
  "a",
  "o",
  "as",
  "os",
  "em",
  "no",
  "na",
  "nos",
  "nas",
]);

/**
 * Aplica Title Case em português: cada palavra começa com letra maiúscula,
 * exceto conectores curtos ("de", "da", "do", "e", etc.) quando estão no
 * meio da frase.
 *
 * Exemplos:
 *  - "tomate cereja"            -> "Tomate Cereja"
 *  - "BANANA da terra"          -> "Banana da Terra"
 *  - "queijo de minas frescal"  -> "Queijo de Minas Frescal"
 *
 * Strings vazias ou já totalmente vazias após trim são devolvidas inalteradas.
 */
export function toTitleCasePtBr(input: string): string {
  if (!input) return input;
  const limpo = input.trim();
  if (!limpo) return input;

  return limpo
    .toLowerCase()
    .split(/\s+/)
    .map((palavra, i) => {
      if (i > 0 && CONECTORES_MINUSCULOS.has(palavra)) {
        return palavra;
      }
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(" ");
}

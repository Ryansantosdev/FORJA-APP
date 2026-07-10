/** Sugestões de proteína (g) por palavra-chave no nome do alimento. */
const SUGGESTIONS: [RegExp, number][] = [
  [/ovo/i, 13],
  [/frango|peito/i, 28],
  [/carne|patinho|boi/i, 26],
  [/whey|prote[ií]na/i, 24],
  [/requeij/i, 2],
  [/p[aã]o/i, 4],
  [/batata/i, 3],
  [/salada|veget|brocol/i, 2],
  [/fruta|ma[cç][aã]|banana|morango|mam[aã]o/i, 1],
  [/iogurte/i, 10],
  [/queijo/i, 7],
  [/atum|salm[aã]o|peixe/i, 22],
  [/feij[aã]o/i, 8],
  [/creatina/i, 0],
];

export function suggestProteinG(nome: string): number | undefined {
  const n = nome.trim();
  if (!n) return undefined;
  for (const [re, g] of SUGGESTIONS) {
    if (re.test(n)) return g;
  }
  return undefined;
}

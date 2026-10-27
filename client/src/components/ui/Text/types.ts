export const TextVariants = {
  H1: 'h1',
  H2: 'h2',
  H3: 'h3',
  T1: 't1',
  T2: 't2',
  T3: 't3',
  T4: 't4',
} as const;
export type TextVariant = (typeof TextVariants)[keyof typeof TextVariants];

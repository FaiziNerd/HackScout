/** Canonical Pakistan city directory + normalizer. Implemented with the Prisma schema. */

export type CitySeed = {
  slug: string;
  name: string;
  province?: string;
  isVirtual: boolean;
};

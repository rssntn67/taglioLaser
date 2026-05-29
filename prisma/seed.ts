import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MATERIALS = [
  {
    nome: 'Acciaio Inox',
    slug: 'inox',
    thicknesses: [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10],
  },
  {
    nome: 'Acciaio al Carbonio',
    slug: 'carbonio',
    thicknesses: [1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15],
  },
  {
    nome: 'Alluminio',
    slug: 'alluminio',
    thicknesses: [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8],
  },
  {
    nome: 'Ottone / Rame',
    slug: 'ottone-rame',
    thicknesses: [0.5, 1, 1.5, 2, 3, 4, 5],
  },
];

const DEFAULT_QUOTA_FISSA = 1.50;
const DEFAULT_COSTO_PER_METRO = 4.00;

async function main() {
  for (const mat of MATERIALS) {
    const material = await prisma.material.upsert({
      where: { slug: mat.slug },
      update: { nome: mat.nome },
      create: { nome: mat.nome, slug: mat.slug },
    });

    for (const valore of mat.thicknesses) {
      const thickness = await prisma.thickness.upsert({
        where: { materialId_valore: { materialId: material.id, valore } },
        update: {},
        create: { materialId: material.id, valore },
      });

      await prisma.price.upsert({
        where: { thicknessId: thickness.id },
        update: {},
        create: {
          thicknessId: thickness.id,
          quotaFissaEur: DEFAULT_QUOTA_FISSA,
          costoPerMetroEur: DEFAULT_COSTO_PER_METRO,
        },
      });
    }
  }

  console.log('Seed completato: materiali, spessori e prezzi di default inseriti.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

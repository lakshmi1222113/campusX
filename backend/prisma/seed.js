
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const categories = [
  "Books",
  "Electronics",
  "Notes",
  "Stationery",
  "Hostel Essentials",
  "Sports",
  "Cycles",
  "Other",
];

async function main() {
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("CampusX categories seeded successfully!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

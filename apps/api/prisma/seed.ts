import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: "Electronics", slug: "electronics" },
    { name: "Fashion", slug: "fashion" },
    { name: "Home & Kitchen", slug: "home-kitchen" },
    { name: "Beauty & Personal Care", slug: "beauty-personal-care" },
    { name: "Sports & Fitness", slug: "sports-fitness" },
    { name: "Books", slug: "books" },
    { name: "Toys & Games", slug: "toys-games" },
    { name: "Accessories", slug: "accessories" },
  ];

  for (const item of categories) {
    await prisma.category.upsert({
      where: { slug: item.slug },
      update: { name: item.name },
      create: item,
    });
  }

  const electronics = await prisma.category.findUniqueOrThrow({
    where: { slug: "electronics" },
  });

  const products = [
    {
      name: "Wireless Headphones",
      slug: "wireless-headphones",
      description: "Comfortable wireless headphones for everyday listening.",
      price: "2499.00",
      stock: 25,
      imageUrl:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
      categoryId: electronics.id,
    },
    {
      name: "Smart Watch",
      slug: "smart-watch",
      description: "A versatile smartwatch for everyday use.",
      price: "3999.00",
      stock: 15,
      imageUrl:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85",
      categoryId: electronics.id,
    },
    {
      name: "Bluetooth Speaker",
      slug: "bluetooth-speaker",
      description: "Portable speaker with wireless connectivity.",
      price: "1799.00",
      stock: 30,
      imageUrl:
        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85",
      categoryId: electronics.id,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        imageUrl: product.imageUrl,
      },
      create: product,
    });
  }

  console.log("SHOPORA categories and sample products seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

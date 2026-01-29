import 'dotenv/config';
import { db } from './db';
import { users, whiskeys } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Starting seed...');

  // Find the admin user
  const [adminUser] = await db
    .select()
    .from(users)
    .where(eq(users.username, 'admin'));

  if (!adminUser) {
    console.error('Admin user not found! Please create an admin user first.');
    process.exit(1);
  }

  console.log(`Found admin user with ID: ${adminUser.id}`);

  const whiskeyData = [
    {
      name: "Jack Daniel's 10 Year Batch 3",
      distillery: "Jack Daniel Distillery",
      type: "Tennessee Whiskey",
      age: 10,
      abv: 48.5,
      price: 170,
      status: "open" as const,
      isWishlist: false,
      isPublic: false,
      userId: adminUser.id,
    },
    {
      name: "Jack Daniel's 12 Year Batch 2",
      distillery: "Jack Daniel Distillery",
      type: "Tennessee Whiskey",
      age: 12,
      abv: 53.5,
      price: 190,
      status: "open" as const,
      isWishlist: false,
      isPublic: false,
      userId: adminUser.id,
    },
    {
      name: "Bardstown Bourbon Collaborative Series Amrut",
      distillery: "Bardstown Bourbon Company",
      type: "Blended Whiskey",
      age: null,
      abv: 55,
      price: 160,
      status: "open" as const,
      isWishlist: false,
      isPublic: false,
      userId: adminUser.id,
    },
    {
      name: "Bardstown Discovery Series #8",
      distillery: "Bardstown Bourbon Company",
      type: "Blended Whiskey",
      age: null,
      abv: 57.05,
      price: 140,
      status: "open" as const,
      isWishlist: false,
      isPublic: false,
      userId: adminUser.id,
    },
    {
      name: "Penelope Rio Batch 2",
      distillery: "MGP (Penelope)",
      type: "Bourbon",
      age: null,
      abv: 49,
      price: 80,
      status: "open" as const,
      isWishlist: false,
      isPublic: false,
      userId: adminUser.id,
    },
    {
      name: "Old Forester 1924 Batch 1",
      distillery: "Brown-Forman",
      type: "Bourbon",
      age: 10,
      abv: 50,
      price: 115,
      status: "open" as const,
      isWishlist: false,
      isPublic: false,
      userId: adminUser.id,
    },
    {
      name: "E.H. Taylor Small Batch",
      distillery: "Buffalo Trace",
      type: "Bourbon",
      age: 7,
      abv: 50,
      price: 80,
      status: "open" as const,
      isWishlist: false,
      isPublic: false,
      userId: adminUser.id,
    },
    {
      name: "Penelope Valencia Batch 1",
      distillery: "MGP (Penelope)",
      type: "Bourbon",
      age: null,
      abv: 47.5,
      price: 80,
      status: "open" as const,
      isWishlist: false,
      isPublic: false,
      userId: adminUser.id,
    },
    {
      name: "Penelope Havana Batch 1",
      distillery: "MGP (Penelope)",
      type: "Bourbon",
      age: null,
      abv: 46.5,
      price: 80,
      status: "open" as const,
      isWishlist: false,
      isPublic: false,
      userId: adminUser.id,
    },
    {
      name: "Eagle Rare 10 Year",
      distillery: "Buffalo Trace",
      type: "Bourbon",
      age: 10,
      abv: 45,
      price: 70,
      status: "open" as const,
      isWishlist: false,
      isPublic: false,
      userId: adminUser.id,
    },
  ];

  console.log(`Inserting ${whiskeyData.length} whiskeys...`);

  for (const whiskey of whiskeyData) {
    const [inserted] = await db.insert(whiskeys).values(whiskey).returning();
    console.log(`  ✓ Added: ${inserted.name} (ID: ${inserted.id})`);
  }

  console.log('\nSeed completed successfully!');
  console.log(`Added ${whiskeyData.length} whiskeys for user "${adminUser.username}"`);

  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});

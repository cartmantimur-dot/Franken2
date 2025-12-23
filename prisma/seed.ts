import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seeding database...");

    // Create admin user
    const passwordHash = await bcrypt.hash("admin123", 12);
    const user = await prisma.user.upsert({
        where: { email: "admin@fraeulein-franken.de" },
        update: {},
        create: {
            email: "admin@fraeulein-franken.de",
            passwordHash,
            name: "Admin",
            role: "admin",
        },
    });
    console.log("✅ Admin user created:", user.email);

    // Create settings
    await prisma.settings.upsert({
        where: { id: "main" },
        update: {},
        create: {
            id: "main",
            companyName: "Fräulein Franken – Geschenke für dich",
            address: "Musterstraße 1",
            zipCode: "90403",
            city: "Nürnberg",
            country: "Deutschland",
            email: "info@fraeulein-franken.de",
            phone: "+49 911 12345678",
            iban: "DE00 0000 0000 0000 0000 00",
            bic: "ABCDEFGH",
            bankName: "Sparkasse Nürnberg",
            invoicePrefix: "FF",
            invoiceYear: 2025,
            invoiceStartNumber: 1,
            invoiceCurrentNumber: 0,
            defaultDueDays: 14,
            vatEnabled: false,
            defaultVatRate: 19,
        },
    });
    console.log("✅ Settings created");

    // Create sample products
    const products = await Promise.all([
        prisma.product.create({
            data: {
                name: "Handgemachte Kerze Lavendel",
                description: "Natürliche Duftkerze mit echtem Lavendelöl",
                category: "Kerzen",
                purchasePrice: 4.50,
                sellingPrice: 12.99,
                stockCurrent: 25,
                stockMinimum: 5,
                location: "Regal A1",
                supplier: "Wax & Co",
            },
        }),
        prisma.product.create({
            data: {
                name: "Keramik Tasse Blumen",
                description: "Handbemalte Keramiktasse mit Blumenmotiv",
                category: "Keramik",
                purchasePrice: 6.00,
                sellingPrice: 18.50,
                stockCurrent: 15,
                stockMinimum: 3,
                location: "Regal B2",
                supplier: "Töpferei Schmidt",
            },
        }),
        prisma.product.create({
            data: {
                name: "Geschenkbox Premium",
                description: "Elegante Geschenkbox mit Satinschleife",
                category: "Verpackung",
                purchasePrice: 2.00,
                sellingPrice: 5.99,
                stockCurrent: 2,
                stockMinimum: 10,
                location: "Lager 1",
                supplier: "Verpackungsservice GmbH",
            },
        }),
    ]);
    console.log("✅ Sample products created:", products.length);

    // Create sample customers
    const customers = await Promise.all([
        prisma.customer.create({
            data: {
                name: "Maria Müller",
                company: null,
                address: "Königstraße 15",
                zipCode: "90402",
                city: "Nürnberg",
                country: "Deutschland",
                email: "maria.mueller@example.com",
                phone: "+49 911 555 1234",
            },
        }),
        prisma.customer.create({
            data: {
                name: "Thomas Schmidt",
                company: "Schmidt Blumenhandel",
                address: "Blumenweg 8",
                zipCode: "90441",
                city: "Nürnberg",
                country: "Deutschland",
                email: "t.schmidt@blumenhandel.de",
                phone: "+49 911 555 5678",
            },
        }),
    ]);
    console.log("✅ Sample customers created:", customers.length);

    console.log("🎉 Seeding complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

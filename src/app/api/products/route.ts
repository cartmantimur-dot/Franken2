import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validators";

// GET all products
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const category = searchParams.get("category") || "";
        const lowStock = searchParams.get("lowStock") === "true";

        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }

        if (category) {
            where.category = category;
        }

        if (lowStock) {
            where.stockCurrent = {
                lte: prisma.product.fields.stockMinimum,
            };
        }

        const products = await prisma.product.findMany({
            where,
            orderBy: { name: "asc" },
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Fehler beim Laden der Produkte" },
            { status: 500 }
        );
    }
}

// POST create product
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validated = productSchema.parse(body);

        const product = await prisma.product.create({
            data: {
                ...validated,
                purchasePrice: validated.purchasePrice,
                sellingPrice: validated.sellingPrice,
            },
        });

        // Log initial stock if any
        if (validated.stockCurrent > 0) {
            await prisma.stockMovement.create({
                data: {
                    productId: product.id,
                    quantity: validated.stockCurrent,
                    reason: "Inventur",
                    reference: "Erstanlage",
                },
            });
        }

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error("Error creating product:", error);
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json(
                { error: "Validierungsfehler", details: error },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Fehler beim Erstellen des Produkts" },
            { status: 500 }
        );
    }
}

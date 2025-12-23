import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stockMovementSchema } from "@/lib/validators";

// POST - Adjust stock
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { quantity, reason, reference } = stockMovementSchema.parse({
            productId: id,
            ...body,
        });

        // Get current product
        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Produkt nicht gefunden" },
                { status: 404 }
            );
        }

        const newStock = product.stockCurrent + quantity;

        if (newStock < 0) {
            return NextResponse.json(
                { error: "Bestand kann nicht negativ werden" },
                { status: 400 }
            );
        }

        // Update stock and create movement in transaction
        const [updatedProduct, movement] = await prisma.$transaction([
            prisma.product.update({
                where: { id },
                data: { stockCurrent: newStock },
            }),
            prisma.stockMovement.create({
                data: {
                    productId: id,
                    quantity,
                    reason,
                    reference,
                },
            }),
        ]);

        return NextResponse.json({
            product: updatedProduct,
            movement,
        });
    } catch (error) {
        console.error("Error adjusting stock:", error);
        return NextResponse.json(
            { error: "Fehler bei der Bestandsanpassung" },
            { status: 500 }
        );
    }
}

// GET - Get stock movements
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const movements = await prisma.stockMovement.findMany({
            where: { productId: id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(movements);
    } catch (error) {
        console.error("Error fetching stock movements:", error);
        return NextResponse.json(
            { error: "Fehler beim Laden der Bestandsbewegungen" },
            { status: 500 }
        );
    }
}

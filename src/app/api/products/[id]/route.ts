import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validators";

// GET single product
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                stockMovements: {
                    orderBy: { createdAt: "desc" },
                    take: 20,
                },
            },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Produkt nicht gefunden" },
                { status: 404 }
            );
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("Error fetching product:", error);
        return NextResponse.json(
            { error: "Fehler beim Laden des Produkts" },
            { status: 500 }
        );
    }
}

// PATCH update product
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validated = productSchema.partial().parse(body);

        const product = await prisma.product.update({
            where: { id },
            data: validated,
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json(
            { error: "Fehler beim Aktualisieren des Produkts" },
            { status: 500 }
        );
    }
}

// DELETE product
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if product is used in invoices
        const invoiceItems = await prisma.invoiceItem.findFirst({
            where: { productId: id },
        });

        if (invoiceItems) {
            return NextResponse.json(
                { error: "Produkt kann nicht gelöscht werden - wird in Rechnungen verwendet" },
                { status: 400 }
            );
        }

        await prisma.product.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json(
            { error: "Fehler beim Löschen des Produkts" },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Finalize invoice (change status and deduct stock)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!invoice) {
            return NextResponse.json(
                { error: "Rechnung nicht gefunden" },
                { status: 404 }
            );
        }

        if (invoice.status !== "Entwurf") {
            return NextResponse.json(
                { error: "Nur Entwürfe können finalisiert werden" },
                { status: 400 }
            );
        }

        // Check stock availability for all items with products
        for (const item of invoice.items) {
            if (item.productId && item.product) {
                if (item.product.stockCurrent < item.quantity) {
                    return NextResponse.json(
                        {
                            error: `Nicht genug Bestand für "${item.product.name}". Verfügbar: ${item.product.stockCurrent}, Benötigt: ${item.quantity}`,
                        },
                        { status: 400 }
                    );
                }
            }
        }

        // Finalize invoice and deduct stock in transaction
        const updatedInvoice = await prisma.$transaction(async (tx) => {
            // Deduct stock for each item with a product
            for (const item of invoice.items) {
                if (item.productId) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stockCurrent: {
                                decrement: item.quantity,
                            },
                        },
                    });

                    // Create stock movement
                    await tx.stockMovement.create({
                        data: {
                            productId: item.productId,
                            quantity: -item.quantity,
                            reason: "Verkauf",
                            reference: invoice.invoiceNumber,
                        },
                    });
                }
            }

            // Update invoice status
            const result = await tx.invoice.update({
                where: { id },
                data: { status: "Gesendet" },
                include: {
                    customer: true,
                    items: true,
                },
            });

            // Create audit log
            await tx.auditLog.create({
                data: {
                    invoiceId: id,
                    action: "STATUS_CHANGED",
                    field: "status",
                    oldValue: "Entwurf",
                    newValue: "Gesendet",
                },
            });

            return result;
        });

        return NextResponse.json(updatedInvoice);
    } catch (error) {
        console.error("Error finalizing invoice:", error);
        return NextResponse.json(
            { error: "Fehler beim Finalisieren der Rechnung" },
            { status: 500 }
        );
    }
}

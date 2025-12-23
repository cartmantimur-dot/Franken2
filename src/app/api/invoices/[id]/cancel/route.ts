import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Cancel invoice (storno + restore stock)
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

        if (invoice.status === "Storniert") {
            return NextResponse.json(
                { error: "Rechnung ist bereits storniert" },
                { status: 400 }
            );
        }

        if (invoice.status === "Entwurf") {
            return NextResponse.json(
                { error: "Entwürfe können nicht storniert werden - bitte löschen" },
                { status: 400 }
            );
        }

        // Cancel invoice and restore stock in transaction
        const updatedInvoice = await prisma.$transaction(async (tx) => {
            // Restore stock for each item with a product (only if it was deducted)
            if (invoice.status === "Gesendet" || invoice.status === "Bezahlt") {
                for (const item of invoice.items) {
                    if (item.productId) {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: {
                                stockCurrent: {
                                    increment: item.quantity,
                                },
                            },
                        });

                        // Create stock movement for reversal
                        await tx.stockMovement.create({
                            data: {
                                productId: item.productId,
                                quantity: item.quantity,
                                reason: "Storno",
                                reference: invoice.invoiceNumber,
                            },
                        });
                    }
                }
            }

            // Update invoice status
            const result = await tx.invoice.update({
                where: { id },
                data: { status: "Storniert" },
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
                    oldValue: invoice.status,
                    newValue: "Storniert",
                },
            });

            return result;
        });

        return NextResponse.json(updatedInvoice);
    } catch (error) {
        console.error("Error canceling invoice:", error);
        return NextResponse.json(
            { error: "Fehler beim Stornieren der Rechnung" },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invoiceSchema } from "@/lib/validators";

// GET single invoice
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true,
                    },
                },
                auditLogs: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!invoice) {
            return NextResponse.json(
                { error: "Rechnung nicht gefunden" },
                { status: 404 }
            );
        }

        return NextResponse.json(invoice);
    } catch (error) {
        console.error("Error fetching invoice:", error);
        return NextResponse.json(
            { error: "Fehler beim Laden der Rechnung" },
            { status: 500 }
        );
    }
}

// PATCH update invoice
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Get current invoice
        const currentInvoice = await prisma.invoice.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!currentInvoice) {
            return NextResponse.json(
                { error: "Rechnung nicht gefunden" },
                { status: 404 }
            );
        }

        // Only allow editing drafts and certain fields after
        if (currentInvoice.status !== "Entwurf" && body.items) {
            return NextResponse.json(
                { error: "Positionen können nur im Entwurf bearbeitet werden" },
                { status: 400 }
            );
        }

        const validated = invoiceSchema.partial().parse(body);

        // Get settings for VAT
        const settings = await prisma.settings.findUnique({
            where: { id: "main" },
        });

        // Calculate totals if items changed
        let subtotalNum = Number(currentInvoice.subtotal);
        let vatRateNum = Number(currentInvoice.vatRate);
        let vatAmountNum = Number(currentInvoice.vatAmount);
        let totalNum = Number(currentInvoice.total);

        if (validated.items) {
            subtotalNum = validated.items.reduce(
                (sum, item) => sum + item.unitPrice * item.quantity,
                0
            );
            const discount = validated.discount ?? Number(currentInvoice.discount) ?? 0;
            const shippingCost = validated.shippingCost ?? Number(currentInvoice.shippingCost) ?? 0;
            subtotalNum = subtotalNum - discount + shippingCost;

            vatRateNum = settings?.vatEnabled ? Number(settings.defaultVatRate) : 0;
            vatAmountNum = settings?.vatEnabled ? subtotalNum * (vatRateNum / 100) : 0;
            totalNum = subtotalNum + vatAmountNum;
        }

        const invoice = await prisma.$transaction(async (tx) => {
            // Delete existing items if updating items
            if (validated.items) {
                await tx.invoiceItem.deleteMany({
                    where: { invoiceId: id },
                });
            }

            // Update invoice
            const updatedInvoice = await tx.invoice.update({
                where: { id },
                data: {
                    ...(validated.invoiceDate && { invoiceDate: new Date(validated.invoiceDate) }),
                    ...(validated.deliveryDate !== undefined && {
                        deliveryDate: validated.deliveryDate ? new Date(validated.deliveryDate) : null,
                    }),
                    ...(validated.dueDate && { dueDate: new Date(validated.dueDate) }),
                    ...(validated.customerId && { customerId: validated.customerId }),
                    ...(validated.discount !== undefined && { discount: validated.discount }),
                    ...(validated.shippingCost !== undefined && { shippingCost: validated.shippingCost }),
                    ...(validated.notes !== undefined && { notes: validated.notes }),
                    ...(validated.items && {
                        subtotal: subtotalNum,
                        vatRate: vatRateNum,
                        vatAmount: vatAmountNum,
                        total: totalNum,
                        items: {
                            create: validated.items.map((item) => ({
                                productId: item.productId || null,
                                title: item.title,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                totalPrice: item.unitPrice * item.quantity,
                            })),
                        },
                    }),
                },
                include: {
                    customer: true,
                    items: true,
                },
            });

            // Create audit log
            await tx.auditLog.create({
                data: {
                    invoiceId: id,
                    action: "UPDATED",
                    oldValue: JSON.stringify({
                        invoiceDate: currentInvoice.invoiceDate,
                        dueDate: currentInvoice.dueDate,
                    }),
                    newValue: JSON.stringify(body),
                },
            });

            return updatedInvoice;
        });

        return NextResponse.json(invoice);
    } catch (error) {
        console.error("Error updating invoice:", error);
        return NextResponse.json(
            { error: "Fehler beim Aktualisieren der Rechnung" },
            { status: 500 }
        );
    }
}

// DELETE invoice
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
        });

        if (!invoice) {
            return NextResponse.json(
                { error: "Rechnung nicht gefunden" },
                { status: 404 }
            );
        }

        if (invoice.status !== "Entwurf") {
            return NextResponse.json(
                { error: "Nur Entwürfe können gelöscht werden" },
                { status: 400 }
            );
        }

        await prisma.invoice.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting invoice:", error);
        return NextResponse.json(
            { error: "Fehler beim Löschen der Rechnung" },
            { status: 500 }
        );
    }
}

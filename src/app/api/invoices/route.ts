import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invoiceSchema } from "@/lib/validators";

// GET all invoices
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";

        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { invoiceNumber: { contains: search, mode: "insensitive" } },
                { customer: { name: { contains: search, mode: "insensitive" } } },
            ];
        }

        if (status) {
            where.status = status;
        }

        const invoices = await prisma.invoice.findMany({
            where,
            include: {
                customer: true,
                items: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(invoices);
    } catch (error) {
        console.error("Error fetching invoices:", error);
        return NextResponse.json(
            { error: "Fehler beim Laden der Rechnungen" },
            { status: 500 }
        );
    }
}

// POST create invoice
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validated = invoiceSchema.parse(body);

        // Get settings for invoice number
        let settings = await prisma.settings.findUnique({
            where: { id: "main" },
        });

        if (!settings) {
            settings = await prisma.settings.create({
                data: { id: "main" },
            });
        }

        // Generate invoice number
        const nextNumber = settings.invoiceCurrentNumber + 1;
        const invoiceNumber = `${settings.invoicePrefix}-${settings.invoiceYear}-${String(nextNumber).padStart(4, "0")}`;

        // Calculate totals
        let subtotal = validated.items.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
        );

        const discount = validated.discount || 0;
        const shippingCost = validated.shippingCost || 0;
        subtotal = subtotal - discount + shippingCost;

        const vatRate = settings.vatEnabled ? Number(settings.defaultVatRate) : 0;
        const vatAmount = settings.vatEnabled ? subtotal * (vatRate / 100) : 0;
        const total = subtotal + vatAmount;

        // Create invoice with items in transaction
        const invoice = await prisma.$transaction(async (tx) => {
            // Update settings current number
            await tx.settings.update({
                where: { id: "main" },
                data: { invoiceCurrentNumber: nextNumber },
            });

            // Create invoice
            const newInvoice = await tx.invoice.create({
                data: {
                    invoiceNumber,
                    invoiceDate: new Date(validated.invoiceDate),
                    deliveryDate: validated.deliveryDate
                        ? new Date(validated.deliveryDate)
                        : null,
                    dueDate: new Date(validated.dueDate),
                    status: validated.status,
                    customerId: validated.customerId,
                    discount,
                    shippingCost,
                    subtotal,
                    vatRate,
                    vatAmount,
                    total,
                    notes: validated.notes,
                    items: {
                        create: validated.items.map((item) => ({
                            productId: item.productId || null,
                            title: item.title,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.unitPrice * item.quantity,
                        })),
                    },
                },
                include: {
                    customer: true,
                    items: true,
                },
            });

            // Create audit log
            await tx.auditLog.create({
                data: {
                    invoiceId: newInvoice.id,
                    action: "CREATED",
                    newValue: JSON.stringify({ invoiceNumber, status: validated.status }),
                },
            });

            return newInvoice;
        });

        return NextResponse.json(invoice, { status: 201 });
    } catch (error) {
        console.error("Error creating invoice:", error);
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json(
                { error: "Validierungsfehler", details: error },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Fehler beim Erstellen der Rechnung" },
            { status: 500 }
        );
    }
}

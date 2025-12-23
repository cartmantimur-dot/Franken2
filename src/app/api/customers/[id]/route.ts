import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validators";

// GET single customer
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                invoices: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        });

        if (!customer) {
            return NextResponse.json(
                { error: "Kunde nicht gefunden" },
                { status: 404 }
            );
        }

        return NextResponse.json(customer);
    } catch (error) {
        console.error("Error fetching customer:", error);
        return NextResponse.json(
            { error: "Fehler beim Laden des Kunden" },
            { status: 500 }
        );
    }
}

// PATCH update customer
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validated = customerSchema.partial().parse(body);

        const customer = await prisma.customer.update({
            where: { id },
            data: {
                ...validated,
                email: validated.email || null,
            },
        });

        return NextResponse.json(customer);
    } catch (error) {
        console.error("Error updating customer:", error);
        return NextResponse.json(
            { error: "Fehler beim Aktualisieren des Kunden" },
            { status: 500 }
        );
    }
}

// DELETE customer
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if customer has invoices
        const invoices = await prisma.invoice.findFirst({
            where: { customerId: id },
        });

        if (invoices) {
            return NextResponse.json(
                { error: "Kunde kann nicht gelöscht werden - hat zugehörige Rechnungen" },
                { status: 400 }
            );
        }

        await prisma.customer.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting customer:", error);
        return NextResponse.json(
            { error: "Fehler beim Löschen des Kunden" },
            { status: 500 }
        );
    }
}

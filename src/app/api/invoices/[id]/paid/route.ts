import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Mark invoice as paid
export async function POST(
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

        if (invoice.status !== "Gesendet") {
            return NextResponse.json(
                { error: "Nur gesendete Rechnungen können als bezahlt markiert werden" },
                { status: 400 }
            );
        }

        const updatedInvoice = await prisma.$transaction(async (tx) => {
            const result = await tx.invoice.update({
                where: { id },
                data: { status: "Bezahlt" },
                include: {
                    customer: true,
                    items: true,
                },
            });

            await tx.auditLog.create({
                data: {
                    invoiceId: id,
                    action: "STATUS_CHANGED",
                    field: "status",
                    oldValue: "Gesendet",
                    newValue: "Bezahlt",
                },
            });

            return result;
        });

        return NextResponse.json(updatedInvoice);
    } catch (error) {
        console.error("Error marking invoice as paid:", error);
        return NextResponse.json(
            { error: "Fehler beim Markieren als bezahlt" },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validators";

// GET all customers
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";

        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { company: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { city: { contains: search, mode: "insensitive" } },
            ];
        }

        const customers = await prisma.customer.findMany({
            where,
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { invoices: true },
                },
            },
        });

        return NextResponse.json(customers);
    } catch (error) {
        console.error("Error fetching customers:", error);
        return NextResponse.json(
            { error: "Fehler beim Laden der Kunden" },
            { status: 500 }
        );
    }
}

// POST create customer
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validated = customerSchema.parse(body);

        // Handle empty email
        const data = {
            ...validated,
            email: validated.email || null,
        };

        const customer = await prisma.customer.create({
            data,
        });

        return NextResponse.json(customer, { status: 201 });
    } catch (error) {
        console.error("Error creating customer:", error);
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json(
                { error: "Validierungsfehler", details: error },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Fehler beim Erstellen des Kunden" },
            { status: 500 }
        );
    }
}

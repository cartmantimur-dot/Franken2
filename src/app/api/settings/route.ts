import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET settings
export async function GET() {
    try {
        let settings = await prisma.settings.findUnique({
            where: { id: "main" },
        });

        if (!settings) {
            settings = await prisma.settings.create({
                data: { id: "main" },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json(
            { error: "Fehler beim Laden der Einstellungen" },
            { status: 500 }
        );
    }
}

// PATCH update settings
export async function PATCH(request: Request) {
    try {
        const body = await request.json();

        const settings = await prisma.settings.upsert({
            where: { id: "main" },
            update: body,
            create: {
                id: "main",
                ...body,
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json(
            { error: "Fehler beim Speichern der Einstellungen" },
            { status: 500 }
        );
    }
}

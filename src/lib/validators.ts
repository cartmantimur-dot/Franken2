import { z } from "zod";

// Produkt Validierung
export const productSchema = z.object({
    sku: z.string().optional().nullable(),
    name: z.string().min(1, "Name ist erforderlich"),
    description: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    purchasePrice: z.number().min(0, "Einkaufspreis muss positiv sein"),
    sellingPrice: z.number().min(0, "Verkaufspreis muss positiv sein"),
    stockCurrent: z.number().int().min(0, "Bestand kann nicht negativ sein"),
    stockMinimum: z.number().int().min(0, "Mindestbestand kann nicht negativ sein"),
    location: z.string().optional().nullable(),
    supplier: z.string().optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
});

export type ProductInput = z.infer<typeof productSchema>;

// Bestandsbewegung Validierung
export const stockMovementSchema = z.object({
    productId: z.string().min(1),
    quantity: z.number().int(),
    reason: z.enum(["Einkauf", "Verkauf", "Korrektur", "Storno", "Inventur"]),
    reference: z.string().optional().nullable(),
});

export type StockMovementInput = z.infer<typeof stockMovementSchema>;

// Kunde Validierung
export const customerSchema = z.object({
    name: z.string().min(1, "Name ist erforderlich"),
    company: z.string().optional().nullable(),
    address: z.string().min(1, "Adresse ist erforderlich"),
    zipCode: z.string().min(1, "PLZ ist erforderlich"),
    city: z.string().min(1, "Ort ist erforderlich"),
    country: z.string().default("Deutschland"),
    email: z.string().email("Ungültige E-Mail").optional().nullable().or(z.literal("")),
    phone: z.string().optional().nullable(),
    vatId: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

// Rechnungsposition Validierung
export const invoiceItemSchema = z.object({
    productId: z.string().optional().nullable(),
    title: z.string().min(1, "Titel ist erforderlich"),
    quantity: z.number().int().min(1, "Menge muss mindestens 1 sein"),
    unitPrice: z.number().min(0, "Einzelpreis muss positiv sein"),
    totalPrice: z.number().min(0),
});

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;

// Rechnung Validierung
export const invoiceSchema = z.object({
    invoiceDate: z.string().or(z.date()),
    deliveryDate: z.string().or(z.date()).optional().nullable(),
    dueDate: z.string().or(z.date()),
    status: z.enum(["Entwurf", "Gesendet", "Bezahlt", "Storniert"]).default("Entwurf"),
    customerId: z.string().min(1, "Kunde ist erforderlich"),
    discount: z.number().min(0).optional().nullable(),
    shippingCost: z.number().min(0).optional().nullable(),
    notes: z.string().optional().nullable(),
    items: z.array(invoiceItemSchema).min(1, "Mindestens eine Position erforderlich"),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;

// Einstellungen Validierung
export const settingsSchema = z.object({
    companyName: z.string().min(1, "Firmenname ist erforderlich"),
    address: z.string().optional().nullable(),
    zipCode: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    country: z.string().default("Deutschland"),
    email: z.string().email().optional().nullable().or(z.literal("")),
    phone: z.string().optional().nullable(),
    iban: z.string().optional().nullable(),
    bic: z.string().optional().nullable(),
    bankName: z.string().optional().nullable(),
    taxNumber: z.string().optional().nullable(),
    logoUrl: z.string().url().optional().nullable(),
    invoicePrefix: z.string().default("FF"),
    invoiceYear: z.number().int().min(2000).max(2100),
    invoiceStartNumber: z.number().int().min(1),
    defaultDueDays: z.number().int().min(0).max(365),
    vatEnabled: z.boolean().default(false),
    defaultVatRate: z.number().min(0).max(100).default(19),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

// Login Validierung
export const loginSchema = z.object({
    email: z.string().email("Ungültige E-Mail-Adresse"),
    password: z.string().min(6, "Passwort muss mindestens 6 Zeichen haben"),
});

export type LoginInput = z.infer<typeof loginSchema>;

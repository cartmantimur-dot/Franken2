// Types für erweiterte Session
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            role?: string;
        };
    }
}

// Produkt mit Beziehungen
export interface ProductWithMovements {
    id: string;
    sku: string | null;
    name: string;
    description: string | null;
    category: string | null;
    purchasePrice: number;
    sellingPrice: number;
    stockCurrent: number;
    stockMinimum: number;
    location: string | null;
    supplier: string | null;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    stockMovements?: StockMovementType[];
}

export interface StockMovementType {
    id: string;
    productId: string;
    quantity: number;
    reason: string;
    reference: string | null;
    createdAt: Date;
}

// Kunde
export interface CustomerType {
    id: string;
    name: string;
    company: string | null;
    address: string;
    zipCode: string;
    city: string;
    country: string;
    email: string | null;
    phone: string | null;
    vatId: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// Rechnung
export interface InvoiceType {
    id: string;
    invoiceNumber: string;
    invoiceDate: Date;
    deliveryDate: Date | null;
    dueDate: Date;
    status: "Entwurf" | "Gesendet" | "Bezahlt" | "Storniert";
    customerId: string;
    customer?: CustomerType;
    discount: number | null;
    shippingCost: number | null;
    subtotal: number;
    vatRate: number;
    vatAmount: number;
    total: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    items?: InvoiceItemType[];
}

export interface InvoiceItemType {
    id: string;
    invoiceId: string;
    productId: string | null;
    product?: ProductWithMovements;
    title: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    createdAt: Date;
}

// Einstellungen
export interface SettingsType {
    id: string;
    companyName: string;
    address: string | null;
    zipCode: string | null;
    city: string | null;
    country: string;
    email: string | null;
    phone: string | null;
    iban: string | null;
    bic: string | null;
    bankName: string | null;
    taxNumber: string | null;
    logoUrl: string | null;
    invoicePrefix: string;
    invoiceYear: number;
    invoiceStartNumber: number;
    invoiceCurrentNumber: number;
    defaultDueDays: number;
    vatEnabled: boolean;
    defaultVatRate: number;
    updatedAt: Date;
}

// Dashboard Stats
export interface DashboardStats {
    totalProducts: number;
    lowStockProducts: number;
    totalCustomers: number;
    openInvoices: number;
    totalRevenue: number;
}

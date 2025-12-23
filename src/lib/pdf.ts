import jsPDF from "jspdf";
import "jspdf-autotable";

declare module "jspdf" {
    interface jsPDF {
        autoTable: (options: {
            startY?: number;
            head?: string[][];
            body?: (string | number)[][];
            theme?: string;
            headStyles?: Record<string, unknown>;
            bodyStyles?: Record<string, unknown>;
            columnStyles?: Record<number, Record<string, unknown>>;
            margin?: { left?: number; right?: number };
            styles?: Record<string, unknown>;
        }) => jsPDF;
        lastAutoTable?: { finalY: number };
    }
}

interface InvoiceForPDF {
    invoiceNumber: string;
    invoiceDate: Date | string;
    deliveryDate: Date | string | null;
    dueDate: Date | string;
    discount: number | null;
    shippingCost: number | null;
    subtotal: number;
    vatRate: number;
    vatAmount: number;
    total: number;
    notes: string | null;
    customer: {
        name: string;
        company: string | null;
        address: string;
        zipCode: string;
        city: string;
        country: string;
    };
    items: {
        title: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }[];
}

interface SettingsForPDF {
    companyName: string;
    address: string | null;
    zipCode: string | null;
    city: string | null;
    email: string | null;
    phone: string | null;
    iban: string | null;
    bic: string | null;
    bankName: string | null;
    taxNumber: string | null;
    vatEnabled: boolean;
}

export function generateInvoicePDF(
    invoice: InvoiceForPDF,
    settings: SettingsForPDF
): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Fonts
    doc.setFont("times", "normal"); // Serifs for a friendlier/classic interaction

    // Colors
    // Soft Violet/Pinkish theme for "Fräulein Franken"
    const primaryColor = "#8b5cf6"; // Violet
    const secondaryColor = "#a78bfa"; // Softer violet
    const textColor = "#4b5563"; // Gray-600
    const mutedColor = "#9ca3af"; // Gray-400

    // Format helpers
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: "EUR",
        }).format(amount);
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    // --- Header ---
    // Logo (Top Left) - async loading handling via Promise is tricky in sync function, 
    // but distinct img element or dataURI works usually if cached.
    // Ideally we pass base64, but let's try adding it by URL assuming it's served.
    try {
        const logoImg = new Image();
        logoImg.src = "/logo.png";
        // Convert to data URL or wait? jsPDF addImage needs data.
        // In a real app we might need to pre-load this.
        // For now, let's assume valid URL or try simple addImage if supported widely.
        doc.addImage(logoImg, "PNG", 20, 15, 40, 40);
    } catch (e) {
        console.warn("Logo could not be loaded", e);
    }

    // Company Info (Top Right)
    doc.setFontSize(10);
    doc.setTextColor(mutedColor);
    let y = 20;
    const rightX = pageWidth - 20;

    doc.text(settings.companyName || "Fräulein Franken", rightX, y, { align: "right" });
    y += 5;
    if (settings.address) {
        doc.text(settings.address, rightX, y, { align: "right" });
        y += 5;
    }
    if (settings.zipCode || settings.city) {
        doc.text(`${settings.zipCode || ""} ${settings.city || ""}`.trim(), rightX, y, { align: "right" });
        y += 5;
    }
    if (settings.email) {
        doc.text(settings.email, rightX, y, { align: "right" });
        y += 5;
    }

    // --- Title & Decorative Line ---
    y = 65;
    doc.setDrawColor(secondaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);

    y += 15;
    doc.setFontSize(26);
    doc.setTextColor(primaryColor);
    doc.setFont("times", "bolditalic"); // Playful touch
    doc.text("Rechnung", 20, y);

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(mutedColor);
    doc.text(`Nr. ${invoice.invoiceNumber}`, pageWidth - 20, y, { align: "right" });

    // --- Details Grid ---
    y += 15;
    const detailY = y;

    // Left: Customer
    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    doc.text("Rechnungsempfänger:", 20, detailY);

    doc.setTextColor(textColor);
    doc.setFontSize(11);
    let custY = detailY + 7;

    if (invoice.customer) {
        if (invoice.customer.company) {
            doc.text(invoice.customer.company, 20, custY);
            custY += 5;
        }
        doc.text(invoice.customer.name, 20, custY);
        custY += 5;
        doc.text(invoice.customer.address, 20, custY);
        custY += 5;
        doc.text(`${invoice.customer.zipCode} ${invoice.customer.city}`, 20, custY);
        custY += 5;
        doc.text(invoice.customer.country, 20, custY);
    }

    // Right: Dates
    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    doc.text("Datum & Fälligkeit:", pageWidth - 20, detailY, { align: "right" });

    doc.setTextColor(textColor);
    let dateY = detailY + 7;

    const dateRightX = pageWidth - 20;

    doc.text(`Rechnungsdatum: ${formatDate(invoice.invoiceDate)}`, dateRightX, dateY, { align: "right" });
    dateY += 5;
    if (invoice.deliveryDate) {
        doc.text(`Lieferdatum: ${formatDate(invoice.deliveryDate)}`, dateRightX, dateY, { align: "right" });
        dateY += 5;
    }
    doc.text(`Fällig bis: ${formatDate(invoice.dueDate)}`, dateRightX, dateY, { align: "right" });


    // --- Items Table ---
    // Playful table: no borders, just header underline, spaced out
    const tableData = invoice.items.map((item) => [
        item.title,
        item.quantity.toString(),
        formatCurrency(Number(item.unitPrice)),
        formatCurrency(Number(item.totalPrice)),
    ]);

    doc.autoTable({
        startY: 120,
        head: [["Beschreibung", "Menge", "Einzelpreis", "Gesamt"]],
        body: tableData,
        theme: "plain",
        styles: {
            font: "times",
            fontSize: 10,
            cellPadding: 6,
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: primaryColor,
            fontStyle: "bolditalic",
            fontSize: 11,
            lineColor: secondaryColor,
            lineWidth: { bottom: 0.5 },
        },
        bodyStyles: {
            textColor: textColor,
        },
        columnStyles: {
            0: { cellWidth: 90 },
            1: { cellWidth: 25, halign: "center" },
            2: { cellWidth: 35, halign: "right" },
            3: { cellWidth: 35, halign: "right" },
        },
        margin: { left: 20, right: 20 },
    });

    // --- Totals ---
    const finalY = doc.lastAutoTable?.finalY || 150;
    let totalsY = finalY + 10;

    // Draw a decorative circle line or something? Keep it clean but friendly.

    // Subtotal
    doc.setFont("times", "normal");
    doc.setTextColor(mutedColor);
    doc.text("Zwischensumme", pageWidth - 70, totalsY);
    doc.setTextColor(textColor);
    doc.text(formatCurrency(Number(invoice.subtotal)), pageWidth - 20, totalsY, { align: "right" });
    totalsY += 6;

    // Discount/Shipping
    if (invoice.discount && Number(invoice.discount) > 0) {
        doc.setTextColor(mutedColor);
        doc.text("Rabatt", pageWidth - 70, totalsY);
        doc.setTextColor(textColor);
        doc.text(`-${formatCurrency(Number(invoice.discount))}`, pageWidth - 20, totalsY, { align: "right" });
        totalsY += 6;
    }
    if (invoice.shippingCost && Number(invoice.shippingCost) > 0) {
        doc.setTextColor(mutedColor);
        doc.text("Versandkosten", pageWidth - 70, totalsY);
        doc.setTextColor(textColor);
        doc.text(formatCurrency(Number(invoice.shippingCost)), pageWidth - 20, totalsY, { align: "right" });
        totalsY += 6;
    }

    // VAT
    if (settings.vatEnabled && Number(invoice.vatRate) > 0) {
        doc.setTextColor(mutedColor);
        doc.text(`MwSt. (${invoice.vatRate}%)`, pageWidth - 70, totalsY);
        doc.setTextColor(textColor);
        doc.text(formatCurrency(Number(invoice.vatAmount)), pageWidth - 20, totalsY, { align: "right" });
        totalsY += 6;
    }

    // Total Line
    totalsY += 4;
    doc.setDrawColor(secondaryColor);
    doc.setLineWidth(0.5);
    doc.line(pageWidth - 90, totalsY, pageWidth - 20, totalsY);
    totalsY += 8;

    // TOTAL
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text("Gesamtbetrag", pageWidth - 70, totalsY);
    doc.text(formatCurrency(Number(invoice.total)), pageWidth - 20, totalsY, { align: "right" });

    // Kleinunternehmer
    if (!settings.vatEnabled) {
        totalsY += 15;
        doc.setFont("times", "italic");
        doc.setFontSize(9);
        doc.setTextColor(mutedColor);
        doc.text(
            "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.",
            pageWidth - 20,
            totalsY,
            { align: "right" }
        );
    }

    // --- Footer / Thank You ---
    const footerY = doc.internal.pageSize.getHeight() - 30;

    // Playful Thank You
    doc.setFont("times", "italic");
    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.text("Vielen Dank für deinen Einkauf!", 20, footerY - 10);
    doc.text("♥", 20, footerY - 4); // Little heart if supported, otherwise just cute text


    // Bank info small at bottom
    doc.setFont("times", "normal");
    doc.setFontSize(8);
    doc.setTextColor(mutedColor);

    let bankText = "";
    if (settings.bankName) bankText += `${settings.bankName}`;
    if (settings.iban) bankText += ` | IBAN: ${settings.iban}`;
    if (settings.bic) bankText += ` | BIC: ${settings.bic}`;

    doc.text(bankText, 20, footerY + 10);

    const ownerInfo = `${settings.companyName} | ${settings.taxNumber ? `Steuernr: ${settings.taxNumber}` : ""}`;
    doc.text(ownerInfo, 20, footerY + 14);

    if (settings.email || settings.phone) {
        doc.text(`Kontakt: ${settings.email || ""} ${settings.phone || ""}`, 20, footerY + 18);
    }

    return doc;
}

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

    // Colors
    const primaryColor = "#7c3aed";
    const textColor = "#1f2937";
    const mutedColor = "#6b7280";

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

    // Header - Company Info
    doc.setFontSize(20);
    doc.setTextColor(primaryColor);
    doc.text(settings.companyName || "Fräulein Franken", 20, 25);

    doc.setFontSize(10);
    doc.setTextColor(mutedColor);
    let y = 35;

    if (settings.address) {
        doc.text(settings.address, 20, y);
        y += 5;
    }
    if (settings.zipCode || settings.city) {
        doc.text(`${settings.zipCode || ""} ${settings.city || ""}`.trim(), 20, y);
        y += 5;
    }
    if (settings.email) {
        doc.text(`E-Mail: ${settings.email}`, 20, y);
        y += 5;
    }
    if (settings.phone) {
        doc.text(`Tel: ${settings.phone}`, 20, y);
    }

    // Invoice Title
    doc.setFontSize(24);
    doc.setTextColor(textColor);
    doc.text("RECHNUNG", pageWidth - 20, 25, { align: "right" });

    doc.setFontSize(11);
    doc.setTextColor(mutedColor);
    doc.text(`Nr. ${invoice.invoiceNumber}`, pageWidth - 20, 35, { align: "right" });

    // Dates Box
    const dateBoxY = 55;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(pageWidth - 85, dateBoxY, 65, 30, 3, 3, "F");

    doc.setFontSize(9);
    doc.setTextColor(mutedColor);
    doc.text("Rechnungsdatum:", pageWidth - 80, dateBoxY + 8);
    doc.text("Lieferdatum:", pageWidth - 80, dateBoxY + 16);
    doc.text("Fällig bis:", pageWidth - 80, dateBoxY + 24);

    doc.setTextColor(textColor);
    doc.text(formatDate(invoice.invoiceDate), pageWidth - 25, dateBoxY + 8, { align: "right" });
    doc.text(
        invoice.deliveryDate ? formatDate(invoice.deliveryDate) : "-",
        pageWidth - 25,
        dateBoxY + 16,
        { align: "right" }
    );
    doc.text(formatDate(invoice.dueDate), pageWidth - 25, dateBoxY + 24, { align: "right" });

    // Customer Address
    const customerY = 55;
    doc.setFontSize(9);
    doc.setTextColor(mutedColor);
    doc.text("Rechnungsadresse:", 20, customerY);

    doc.setFontSize(11);
    doc.setTextColor(textColor);
    let customerLineY = customerY + 8;

    if (invoice.customer) {
        if (invoice.customer.company) {
            doc.setFont("helvetica", "bold");
            doc.text(invoice.customer.company, 20, customerLineY);
            customerLineY += 5;
            doc.setFont("helvetica", "normal");
        }
        doc.text(invoice.customer.name, 20, customerLineY);
        customerLineY += 5;
        doc.text(invoice.customer.address, 20, customerLineY);
        customerLineY += 5;
        doc.text(`${invoice.customer.zipCode} ${invoice.customer.city}`, 20, customerLineY);
        customerLineY += 5;
        doc.text(invoice.customer.country, 20, customerLineY);
    }

    // Items Table
    const tableData = invoice.items.map((item) => [
        item.title,
        item.quantity.toString(),
        formatCurrency(Number(item.unitPrice)),
        formatCurrency(Number(item.totalPrice)),
    ]);

    doc.autoTable({
        startY: 100,
        head: [["Beschreibung", "Menge", "Einzelpreis", "Gesamt"]],
        body: tableData,
        theme: "plain",
        headStyles: {
            fillColor: [124, 58, 237],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 10,
        },
        bodyStyles: {
            fontSize: 10,
            textColor: [31, 41, 55],
        },
        columnStyles: {
            0: { cellWidth: 90 },
            1: { cellWidth: 25, halign: "center" },
            2: { cellWidth: 35, halign: "right" },
            3: { cellWidth: 35, halign: "right" },
        },
        margin: { left: 20, right: 20 },
        styles: {
            cellPadding: 5,
            lineColor: [229, 231, 235],
            lineWidth: 0.1,
        },
    });

    // Totals
    const finalY = doc.lastAutoTable?.finalY || 150;
    let totalsY = finalY + 15;

    // Discount & Shipping
    if (invoice.discount && Number(invoice.discount) > 0) {
        doc.setFontSize(10);
        doc.setTextColor(mutedColor);
        doc.text("Rabatt:", pageWidth - 75, totalsY);
        doc.setTextColor(textColor);
        doc.text(`-${formatCurrency(Number(invoice.discount))}`, pageWidth - 20, totalsY, { align: "right" });
        totalsY += 7;
    }

    if (invoice.shippingCost && Number(invoice.shippingCost) > 0) {
        doc.setFontSize(10);
        doc.setTextColor(mutedColor);
        doc.text("Versandkosten:", pageWidth - 75, totalsY);
        doc.setTextColor(textColor);
        doc.text(formatCurrency(Number(invoice.shippingCost)), pageWidth - 20, totalsY, { align: "right" });
        totalsY += 7;
    }

    // Subtotal
    doc.setTextColor(mutedColor);
    doc.text("Zwischensumme:", pageWidth - 75, totalsY);
    doc.setTextColor(textColor);
    doc.text(formatCurrency(Number(invoice.subtotal)), pageWidth - 20, totalsY, { align: "right" });
    totalsY += 7;

    // VAT
    if (settings.vatEnabled && Number(invoice.vatRate) > 0) {
        doc.setTextColor(mutedColor);
        doc.text(`MwSt. (${invoice.vatRate}%):`, pageWidth - 75, totalsY);
        doc.setTextColor(textColor);
        doc.text(formatCurrency(Number(invoice.vatAmount)), pageWidth - 20, totalsY, { align: "right" });
        totalsY += 7;
    }

    // Total
    totalsY += 3;
    doc.setFillColor(124, 58, 237);
    doc.roundedRect(pageWidth - 90, totalsY - 5, 70, 12, 2, 2, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Gesamtbetrag:", pageWidth - 85, totalsY + 3);
    doc.text(formatCurrency(Number(invoice.total)), pageWidth - 25, totalsY + 3, { align: "right" });

    // Kleinunternehmer Note
    if (!settings.vatEnabled) {
        totalsY += 20;
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(mutedColor);
        doc.text(
            "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.",
            20,
            totalsY
        );
        totalsY += 7;
    }

    // Payment Info
    totalsY += 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(textColor);
    doc.text("Zahlungsinformationen", 20, totalsY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    totalsY += 7;

    if (settings.bankName) {
        doc.text(`Bank: ${settings.bankName}`, 20, totalsY);
        totalsY += 5;
    }
    if (settings.iban) {
        doc.text(`IBAN: ${settings.iban}`, 20, totalsY);
        totalsY += 5;
    }
    if (settings.bic) {
        doc.text(`BIC: ${settings.bic}`, 20, totalsY);
        totalsY += 5;
    }

    // Notes
    if (invoice.notes) {
        totalsY += 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Anmerkungen", 20, totalsY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        totalsY += 7;
        const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 40);
        doc.text(splitNotes, 20, totalsY);
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(8);
    doc.setTextColor(mutedColor);
    doc.text(
        `${settings.companyName} | ${settings.taxNumber ? `Steuernr.: ${settings.taxNumber}` : ""}`,
        pageWidth / 2,
        footerY,
        { align: "center" }
    );

    return doc;
}

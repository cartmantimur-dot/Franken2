"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Check, X, Edit2, FileText, Trash2 } from "lucide-react";
import Button from "@/components/Button";
import toast from "react-hot-toast";
import { generateInvoicePDF } from "@/lib/pdf";

interface Invoice {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    deliveryDate: string | null;
    dueDate: string;
    status: string;
    discount: number;
    shippingCost: number;
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
        id: string;
        title: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }[];
}

interface Settings {
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
    vatEnabled: boolean;
    invoicePrefix: string;
    invoiceYear: number;
}

export default function RechnungDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [resolvedParams.id]);

    const fetchData = async () => {
        try {
            const [invoiceRes, settingsRes] = await Promise.all([
                fetch(`/api/invoices/${resolvedParams.id}`),
                fetch("/api/settings"),
            ]);

            if (!invoiceRes.ok) {
                throw new Error("Rechnung nicht gefunden");
            }

            const invoiceData = await invoiceRes.json();
            const settingsData = await settingsRes.json();

            setInvoice(invoiceData);
            setSettings(settingsData);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Fehler beim Laden");
            router.push("/rechnungen");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!invoice) return;

        // Warn user
        if (!confirm(`ACHTUNG: Rechnung ${invoice.invoiceNumber} wirklich KOMPLETT LÖSCHEN?\n\nDies kann nicht rückgängig gemacht werden!\nDer Rechnungszähler wird nur zurückgesetzt, wenn es die letzte Rechnung war.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }
            toast.success("Rechnung gelöscht");
            router.push("/rechnungen");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Fehler");
        }
    };

    const handleStatusChange = async (action: "finalize" | "paid" | "cancel") => {
        if (!invoice) return;

        const confirmMessages = {
            finalize: "Rechnung finalisieren? Der Bestand wird abgebucht.",
            paid: "Rechnung als bezahlt markieren?",
            cancel: "Rechnung stornieren? Der Bestand wird zurückgebucht.",
        };

        if (!confirm(confirmMessages[action])) return;

        try {
            const res = await fetch(`/api/invoices/${invoice.id}/${action}`, {
                method: "POST",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }

            toast.success(
                action === "finalize"
                    ? "Rechnung finalisiert"
                    : action === "paid"
                        ? "Als bezahlt markiert"
                        : "Rechnung storniert"
            );
            fetchData();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Fehler");
        }
    };

    const handleDownloadPDF = () => {
        if (!invoice || !settings) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdf = generateInvoicePDF(invoice as any, settings as any);
        pdf.save(`${invoice.invoiceNumber}.pdf`);
        toast.success("PDF heruntergeladen");
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const getStatusBadge = (status: string) => {
        const classes: Record<string, string> = {
            Entwurf: "badge-neutral",
            Gesendet: "badge-info",
            Bezahlt: "badge-success",
            Storniert: "badge-danger",
        };
        return classes[status] || "badge-neutral";
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner border-violet-600" />
            </div>
        );
    }

    if (!invoice) return null;

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="page-title">{invoice.invoiceNumber}</h1>
                            <span className={`badge ${getStatusBadge(invoice.status)}`}>
                                {invoice.status}
                            </span>
                        </div>
                        <p className="text-gray-500">{invoice.customer.name}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button onClick={handleDownloadPDF} variant="outline">
                        <Download size={18} />
                        PDF herunterladen
                    </Button>

                    {invoice.status === "Entwurf" && (
                        <>
                            <Button
                                onClick={() => router.push(`/rechnungen/${invoice.id}/bearbeiten`)}
                                variant="outline"
                            >
                                <Edit2 size={18} />
                                Bearbeiten
                            </Button>
                            <Button onClick={() => handleStatusChange("finalize")}>
                                <FileText size={18} />
                                Finalisieren
                            </Button>
                        </>
                    )}

                    {invoice.status === "Gesendet" && (
                        <Button onClick={() => handleStatusChange("paid")} variant="success">
                            <Check size={18} />
                            Als bezahlt markieren
                        </Button>
                    )}

                    {(invoice.status === "Gesendet" || invoice.status === "Bezahlt") && (
                        <Button onClick={() => handleStatusChange("cancel")} variant="danger">
                            <X size={18} />
                            Stornieren
                        </Button>
                    )}

                    <Button onClick={handleDelete} className="bg-red-800 hover:bg-red-900 text-white border-red-900">
                        <Trash2 size={18} />
                        Löschen
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items */}
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4">Positionen</h2>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Beschreibung</th>
                                        <th className="text-center">Menge</th>
                                        <th className="text-right">Einzelpreis</th>
                                        <th className="text-right">Gesamt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="font-medium">{item.title}</td>
                                            <td className="text-center">{item.quantity}</td>
                                            <td className="text-right">{formatCurrency(Number(item.unitPrice))}</td>
                                            <td className="text-right font-medium">
                                                {formatCurrency(Number(item.totalPrice))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="mt-6 pt-4 border-t dark:border-gray-700">
                            <div className="max-w-xs ml-auto space-y-2">
                                {invoice.discount > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Rabatt</span>
                                        <span>-{formatCurrency(Number(invoice.discount))}</span>
                                    </div>
                                )}
                                {invoice.shippingCost > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Versandkosten</span>
                                        <span>{formatCurrency(Number(invoice.shippingCost))}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600">
                                    <span>Zwischensumme</span>
                                    <span>{formatCurrency(Number(invoice.subtotal))}</span>
                                </div>
                                {settings?.vatEnabled && Number(invoice.vatRate) > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>MwSt. ({invoice.vatRate}%)</span>
                                        <span>{formatCurrency(Number(invoice.vatAmount))}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xl font-bold pt-2 border-t dark:border-gray-700">
                                    <span>Gesamt</span>
                                    <span className="text-violet-600">{formatCurrency(Number(invoice.total))}</span>
                                </div>
                            </div>

                            {!settings?.vatEnabled && (
                                <p className="text-sm text-gray-500 italic mt-4 text-right">
                                    Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    {invoice.notes && (
                        <div className="card">
                            <h2 className="text-lg font-semibold mb-2">Anmerkungen</h2>
                            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                {invoice.notes}
                            </p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Dates */}
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4">Details</h2>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-sm text-gray-500">Rechnungsdatum</dt>
                                <dd className="font-medium">{formatDate(invoice.invoiceDate)}</dd>
                            </div>
                            {invoice.deliveryDate && (
                                <div>
                                    <dt className="text-sm text-gray-500">Lieferdatum</dt>
                                    <dd className="font-medium">{formatDate(invoice.deliveryDate)}</dd>
                                </div>
                            )}
                            <div>
                                <dt className="text-sm text-gray-500">Fälligkeitsdatum</dt>
                                <dd className="font-medium">{formatDate(invoice.dueDate)}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Customer */}
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4">Kunde</h2>
                        <div className="text-gray-600 dark:text-gray-400">
                            <p className="font-medium text-gray-900 dark:text-white">
                                {invoice.customer.name}
                            </p>
                            {invoice.customer.company && <p>{invoice.customer.company}</p>}
                            <p className="mt-2">{invoice.customer.address}</p>
                            <p>
                                {invoice.customer.zipCode} {invoice.customer.city}
                            </p>
                            <p>{invoice.customer.country}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

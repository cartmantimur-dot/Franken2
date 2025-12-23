"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, FileText, Download, Eye, Check, X } from "lucide-react";
import Button from "@/components/Button";
import toast from "react-hot-toast";

interface Invoice {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    status: string;
    total: number;
    customer: {
        name: string;
        company: string | null;
    };
}

export default function RechnungenPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchInvoices();
    }, [search, statusFilter]);

    const fetchInvoices = async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (statusFilter) params.append("status", statusFilter);

            const res = await fetch(`/api/invoices?${params}`);
            const data = await res.json();
            setInvoices(data);
        } catch {
            toast.error("Fehler beim Laden der Rechnungen");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (invoice: Invoice, action: "finalize" | "paid" | "cancel") => {
        const confirmMessages = {
            finalize: `Rechnung "${invoice.invoiceNumber}" finalisieren? Der Bestand wird abgebucht.`,
            paid: `Rechnung "${invoice.invoiceNumber}" als bezahlt markieren?`,
            cancel: `Rechnung "${invoice.invoiceNumber}" stornieren? Der Bestand wird zurückgebucht.`,
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
            fetchInvoices();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Fehler");
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("de-DE");
    };

    const getStatusBadge = (status: string) => {
        const statusClasses: Record<string, string> = {
            Entwurf: "badge-neutral",
            Gesendet: "badge-info",
            Bezahlt: "badge-success",
            Storniert: "badge-danger",
        };
        return statusClasses[status] || "badge-neutral";
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="page-title">Rechnungen</h1>
                    <p className="page-subtitle">Rechnungsverwaltung</p>
                </div>
                <Link href="/rechnungen/neu">
                    <Button>
                        <Plus size={18} />
                        Neue Rechnung
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Suchen nach Nummer, Kunde..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-10"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input w-auto"
                >
                    <option value="">Alle Status</option>
                    <option value="Entwurf">Entwurf</option>
                    <option value="Gesendet">Gesendet</option>
                    <option value="Bezahlt">Bezahlt</option>
                    <option value="Storniert">Storniert</option>
                </select>
            </div>

            {/* Invoices Table */}
            <div className="table-container bg-white dark:bg-gray-900">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Nummer</th>
                            <th>Kunde</th>
                            <th>Datum</th>
                            <th>Fällig</th>
                            <th>Status</th>
                            <th className="text-right">Betrag</th>
                            <th className="text-right">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-500">
                                    Laden...
                                </td>
                            </tr>
                        ) : invoices.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-500">
                                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    Keine Rechnungen gefunden
                                </td>
                            </tr>
                        ) : (
                            invoices.map((invoice) => (
                                <tr key={invoice.id}>
                                    <td className="font-medium text-gray-900 dark:text-white">
                                        {invoice.invoiceNumber}
                                    </td>
                                    <td>
                                        <p className="text-gray-900 dark:text-white">{invoice.customer.name}</p>
                                        {invoice.customer.company && (
                                            <p className="text-sm text-gray-500">{invoice.customer.company}</p>
                                        )}
                                    </td>
                                    <td className="text-gray-600 dark:text-gray-400">
                                        {formatDate(invoice.invoiceDate)}
                                    </td>
                                    <td className="text-gray-600 dark:text-gray-400">
                                        {formatDate(invoice.dueDate)}
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusBadge(invoice.status)}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="text-right font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(Number(invoice.total))}
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Link
                                                href={`/rechnungen/${invoice.id}`}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                                title="Anzeigen"
                                            >
                                                <Eye size={16} className="text-gray-500" />
                                            </Link>
                                            {invoice.status === "Entwurf" && (
                                                <button
                                                    onClick={() => handleStatusChange(invoice, "finalize")}
                                                    className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                    title="Finalisieren"
                                                >
                                                    <Download size={16} className="text-blue-500" />
                                                </button>
                                            )}
                                            {invoice.status === "Gesendet" && (
                                                <button
                                                    onClick={() => handleStatusChange(invoice, "paid")}
                                                    className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                                    title="Als bezahlt markieren"
                                                >
                                                    <Check size={16} className="text-emerald-500" />
                                                </button>
                                            )}
                                            {(invoice.status === "Gesendet" || invoice.status === "Bezahlt") && (
                                                <button
                                                    onClick={() => handleStatusChange(invoice, "cancel")}
                                                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    title="Stornieren"
                                                >
                                                    <X size={16} className="text-red-500" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

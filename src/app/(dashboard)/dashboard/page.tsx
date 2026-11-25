import { prisma } from "@/lib/prisma";
import {
    Package,
    Users,
    FileText,
    AlertTriangle,
    TrendingUp,
    ArrowRight,
} from "lucide-react";
import Link from "next/link";

async function getDashboardStats() {
    const [
        totalProducts,
        lowStockProducts,
        totalCustomers,
        openInvoices,
        paidInvoices,
    ] = await Promise.all([
        prisma.product.count(),
        prisma.product.count({
            where: {
                stockCurrent: {
                    lt: prisma.product.fields.stockMinimum,
                },
            },
        }),
        prisma.customer.count(),
        prisma.invoice.count({
            where: {
                status: {
                    in: ["Entwurf", "Gesendet"],
                },
            },
        }),
        prisma.invoice.findMany({
            where: { status: "Bezahlt" },
            select: { total: true },
        }),
    ]);

    const totalRevenue = paidInvoices.reduce(
        (sum, inv) => sum + Number(inv.total),
        0
    );

    return {
        totalProducts,
        lowStockProducts,
        totalCustomers,
        openInvoices,
        totalRevenue,
    };
}

async function getLowStockProducts() {
    return prisma.product.findMany({
        where: {
            stockCurrent: {
                lte: prisma.product.fields.stockMinimum,
            },
        },
        orderBy: { stockCurrent: "asc" },
        take: 5,
    });
}

async function getRecentInvoices() {
    return prisma.invoice.findMany({
        include: { customer: true },
        orderBy: { createdAt: "desc" },
        take: 5,
    });
}

export default async function DashboardPage() {
    const stats = await getDashboardStats();
    const lowStockProducts = await getLowStockProducts();
    const recentInvoices = await getRecentInvoices();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: "EUR",
        }).format(amount);
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
            {/* Header */}
            <div className="page-header">
                <p className="eyebrow mb-2">
                    {new Date().toLocaleDateString("de-DE", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        timeZone: "Europe/Berlin",
                    })}
                </p>
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">
                    Willkommen bei Fräulein Franken – Geschenke für dich
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="stat-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="stat-value">{stats.totalProducts}</p>
                            <p className="stat-label">Produkte gesamt</p>
                        </div>
                        <div className="w-11 h-11 shrink-0 rounded-full bg-brand-50 ring-1 ring-inset ring-brand-100 flex items-center justify-center">
                            <Package strokeWidth={1.75} className="w-5 h-5 text-brand-600" />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className={`stat-value ${stats.lowStockProducts > 0 ? "text-amber-600" : ""}`}>
                                {stats.lowStockProducts}
                            </p>
                            <p className="stat-label">Niedriger Bestand</p>
                        </div>
                        <div className={`w-11 h-11 shrink-0 rounded-full ring-1 ring-inset flex items-center justify-center ${stats.lowStockProducts > 0
                                ? "bg-amber-50 ring-amber-100"
                                : "bg-emerald-50 ring-emerald-100"
                            }`}>
                            <AlertTriangle strokeWidth={1.75} className={`w-5 h-5 ${stats.lowStockProducts > 0
                                    ? "text-amber-600"
                                    : "text-emerald-600"
                                }`} />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="stat-value">{stats.openInvoices}</p>
                            <p className="stat-label">Offene Rechnungen</p>
                        </div>
                        <div className="w-11 h-11 shrink-0 rounded-full bg-blue-50 ring-1 ring-inset ring-blue-100 flex items-center justify-center">
                            <FileText strokeWidth={1.75} className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="stat-value">{formatCurrency(stats.totalRevenue)}</p>
                            <p className="stat-label">Gesamtumsatz (bezahlt)</p>
                        </div>
                        <div className="w-11 h-11 shrink-0 rounded-full bg-emerald-50 ring-1 ring-inset ring-emerald-100 flex items-center justify-center">
                            <TrendingUp strokeWidth={1.75} className="w-5 h-5 text-emerald-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock Products */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2>
                            Niedriger Bestand
                        </h2>
                        <Link
                            href="/produkte"
                            className="text-sm font-medium text-brand-600 hover:text-brand-800 flex items-center gap-1 transition-colors"
                        >
                            Alle anzeigen <ArrowRight size={16} />
                        </Link>
                    </div>

                    {lowStockProducts.length === 0 ? (
                        <p className="text-ink-500 text-sm py-4 text-center">
                            Alle Produkte haben ausreichend Bestand ✓
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {lowStockProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-ink-50/70"
                                >
                                    <div>
                                        <p className="font-medium text-ink-900">
                                            {product.name}
                                        </p>
                                        <p className="text-sm text-ink-500">
                                            {product.category || "Ohne Kategorie"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${product.stockCurrent === 0
                                                ? "text-red-600"
                                                : "text-amber-600"
                                            }`}>
                                            {product.stockCurrent} Stück
                                        </p>
                                        <p className="text-xs text-ink-500">
                                            Min: {product.stockMinimum}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Invoices */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2>
                            Letzte Rechnungen
                        </h2>
                        <Link
                            href="/rechnungen"
                            className="text-sm font-medium text-brand-600 hover:text-brand-800 flex items-center gap-1 transition-colors"
                        >
                            Alle anzeigen <ArrowRight size={16} />
                        </Link>
                    </div>

                    {recentInvoices.length === 0 ? (
                        <p className="text-ink-500 text-sm py-4 text-center">
                            Noch keine Rechnungen vorhanden
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {recentInvoices.map((invoice) => (
                                <Link
                                    key={invoice.id}
                                    href={`/rechnungen/${invoice.id}`}
                                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-ink-50/70 hover:bg-brand-50/60 transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-ink-900">
                                            {invoice.invoiceNumber}
                                        </p>
                                        <p className="text-sm text-ink-500">
                                            {invoice.customer.name}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-ink-900">
                                            {formatCurrency(Number(invoice.total))}
                                        </p>
                                        <span className={`badge mt-1 ${getStatusBadge(invoice.status)}`}>
                                            {invoice.status}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 rounded-2xl border border-brand-100 bg-brand-50 p-6 md:p-7">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-display text-2xl font-semibold text-ink-900">Schnellaktionen</h3>
                        <p className="text-[15px] text-ink-600 mt-0.5">
                            Erstelle neue Einträge oder verwalte dein Geschäft
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/produkte?new=true"
                            className="btn bg-white text-brand-700 border border-brand-200 hover:border-brand-300 hover:bg-white shadow-[0_1px_2px_rgb(91_34_58/0.08)]"
                        >
                            <Package size={18} />
                            Neues Produkt
                        </Link>
                        <Link
                            href="/kunden?new=true"
                            className="btn bg-white text-brand-700 border border-brand-200 hover:border-brand-300 hover:bg-white shadow-[0_1px_2px_rgb(91_34_58/0.08)]"
                        >
                            <Users size={18} />
                            Neuer Kunde
                        </Link>
                        <Link
                            href="/rechnungen/neu"
                            className="btn bg-white text-brand-700 border border-brand-200 hover:border-brand-300 hover:bg-white shadow-[0_1px_2px_rgb(91_34_58/0.08)]"
                        >
                            <FileText size={18} />
                            Neue Rechnung
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

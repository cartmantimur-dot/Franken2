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
                        <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center dark:bg-violet-900/30">
                            <Package className="w-6 h-6 text-violet-600 dark:text-violet-400" />
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
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.lowStockProducts > 0
                                ? "bg-amber-100 dark:bg-amber-900/30"
                                : "bg-emerald-100 dark:bg-emerald-900/30"
                            }`}>
                            <AlertTriangle className={`w-6 h-6 ${stats.lowStockProducts > 0
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-emerald-600 dark:text-emerald-400"
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
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center dark:bg-blue-900/30">
                            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="stat-value">{formatCurrency(stats.totalRevenue)}</p>
                            <p className="stat-label">Gesamtumsatz (bezahlt)</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center dark:bg-emerald-900/30">
                            <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock Products */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Niedriger Bestand
                        </h2>
                        <Link
                            href="/produkte"
                            className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1 dark:text-violet-400"
                        >
                            Alle anzeigen <ArrowRight size={16} />
                        </Link>
                    </div>

                    {lowStockProducts.length === 0 ? (
                        <p className="text-gray-500 text-sm py-4 text-center dark:text-gray-400">
                            Alle Produkte haben ausreichend Bestand ✓
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {lowStockProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {product.name}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {product.category || "Ohne Kategorie"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${product.stockCurrent === 0
                                                ? "text-red-600 dark:text-red-400"
                                                : "text-amber-600 dark:text-amber-400"
                                            }`}>
                                            {product.stockCurrent} Stück
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
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
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Letzte Rechnungen
                        </h2>
                        <Link
                            href="/rechnungen"
                            className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1 dark:text-violet-400"
                        >
                            Alle anzeigen <ArrowRight size={16} />
                        </Link>
                    </div>

                    {recentInvoices.length === 0 ? (
                        <p className="text-gray-500 text-sm py-4 text-center dark:text-gray-400">
                            Noch keine Rechnungen vorhanden
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {recentInvoices.map((invoice) => (
                                <Link
                                    key={invoice.id}
                                    href={`/rechnungen/${invoice.id}`}
                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors dark:bg-gray-800/50 dark:hover:bg-gray-800"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {invoice.invoiceNumber}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {invoice.customer.name}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency(Number(invoice.total))}
                                        </p>
                                        <span className={`badge ${getStatusBadge(invoice.status)}`}>
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
            <div className="mt-8 p-6 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="text-white">
                        <h3 className="text-lg font-semibold">Schnellaktionen</h3>
                        <p className="text-violet-100">
                            Erstelle neue Einträge oder verwalte dein Geschäft
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/produkte?new=true"
                            className="btn bg-white text-violet-600 hover:bg-violet-50"
                        >
                            <Package size={18} />
                            Neues Produkt
                        </Link>
                        <Link
                            href="/kunden?new=true"
                            className="btn bg-white text-violet-600 hover:bg-violet-50"
                        >
                            <Users size={18} />
                            Neuer Kunde
                        </Link>
                        <Link
                            href="/rechnungen/neu"
                            className="btn bg-white text-violet-600 hover:bg-violet-50"
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

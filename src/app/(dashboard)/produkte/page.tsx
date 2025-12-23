"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, AlertTriangle, Package } from "lucide-react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import toast from "react-hot-toast";

interface Product {
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
}

export default function ProduktePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [stockProduct, setStockProduct] = useState<Product | null>(null);

    const [formData, setFormData] = useState({
        sku: "",
        name: "",
        description: "",
        category: "",
        purchasePrice: 0,
        sellingPrice: 0,
        stockCurrent: 0,
        stockMinimum: 0,
        location: "",
        supplier: "",
    });

    const [stockData, setStockData] = useState({
        quantity: 0,
        reason: "Einkauf" as string,
        reference: "",
    });

    useEffect(() => {
        fetchProducts();
    }, [search]);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
            const data = await res.json();
            setProducts(data);
        } catch {
            toast.error("Fehler beim Laden der Produkte");
        } finally {
            setIsLoading(false);
        }
    };

    const openNewModal = () => {
        setEditingProduct(null);
        setFormData({
            sku: "",
            name: "",
            description: "",
            category: "",
            purchasePrice: 0,
            sellingPrice: 0,
            stockCurrent: 0,
            stockMinimum: 0,
            location: "",
            supplier: "",
        });
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            sku: product.sku || "",
            name: product.name,
            description: product.description || "",
            category: product.category || "",
            purchasePrice: Number(product.purchasePrice),
            sellingPrice: Number(product.sellingPrice),
            stockCurrent: product.stockCurrent,
            stockMinimum: product.stockMinimum,
            location: product.location || "",
            supplier: product.supplier || "",
        });
        setIsModalOpen(true);
    };

    const openStockModal = (product: Product) => {
        setStockProduct(product);
        setStockData({ quantity: 0, reason: "Einkauf", reference: "" });
        setIsStockModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
            const method = editingProduct ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    sku: formData.sku || null,
                    description: formData.description || null,
                    category: formData.category || null,
                    location: formData.location || null,
                    supplier: formData.supplier || null,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }

            toast.success(editingProduct ? "Produkt aktualisiert" : "Produkt erstellt");
            setIsModalOpen(false);
            fetchProducts();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Fehler");
        }
    };

    const handleStockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stockProduct) return;

        try {
            const res = await fetch(`/api/products/${stockProduct.id}/stock`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(stockData),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }

            toast.success("Bestand aktualisiert");
            setIsStockModalOpen(false);
            fetchProducts();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Fehler");
        }
    };

    const handleDelete = async (product: Product) => {
        if (!confirm(`Produkt "${product.name}" wirklich löschen?`)) return;

        try {
            const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }
            toast.success("Produkt gelöscht");
            fetchProducts();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Fehler");
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount);
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="page-title">Produkte</h1>
                    <p className="page-subtitle">Warenbestand verwalten</p>
                </div>
                <Button onClick={openNewModal}>
                    <Plus size={18} />
                    Neues Produkt
                </Button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Suchen nach Name, SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-10"
                    />
                </div>
            </div>

            {/* Products Table */}
            <div className="table-container bg-white dark:bg-gray-900">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Produkt</th>
                            <th>Kategorie</th>
                            <th className="text-right">EK</th>
                            <th className="text-right">VK</th>
                            <th className="text-center">Bestand</th>
                            <th className="text-right">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-500">
                                    Laden...
                                </td>
                            </tr>
                        ) : products.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-500">
                                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    Keine Produkte gefunden
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                                            {product.sku && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {product.sku}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="text-gray-600 dark:text-gray-400">
                                        {product.category || "-"}
                                    </td>
                                    <td className="text-right text-gray-600 dark:text-gray-400">
                                        {formatCurrency(Number(product.purchasePrice))}
                                    </td>
                                    <td className="text-right font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(Number(product.sellingPrice))}
                                    </td>
                                    <td className="text-center">
                                        <button
                                            onClick={() => openStockModal(product)}
                                            className={`font-medium px-3 py-1 rounded-full text-sm ${product.stockCurrent === 0
                                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    : product.stockCurrent <= product.stockMinimum
                                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                }`}
                                        >
                                            {product.stockCurrent === 0 && (
                                                <AlertTriangle className="w-3 h-3 inline mr-1" />
                                            )}
                                            {product.stockCurrent} Stück
                                        </button>
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(product)}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                            >
                                                <Edit2 size={16} className="text-gray-500" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product)}
                                                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 size={16} className="text-red-500" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Product Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProduct ? "Produkt bearbeiten" : "Neues Produkt"}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="label">Produktname *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">SKU</label>
                            <input
                                type="text"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                className="input"
                                placeholder="z.B. FF-001"
                            />
                        </div>
                        <div>
                            <label className="label">Kategorie</label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="input"
                                placeholder="z.B. Kerzen"
                            />
                        </div>
                        <div>
                            <label className="label">Einkaufspreis *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.purchasePrice}
                                onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Verkaufspreis *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.sellingPrice}
                                onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })}
                                className="input"
                                required
                            />
                        </div>
                        {!editingProduct && (
                            <>
                                <div>
                                    <label className="label">Anfangsbestand</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.stockCurrent}
                                        onChange={(e) => setFormData({ ...formData, stockCurrent: parseInt(e.target.value) })}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="label">Mindestbestand</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.stockMinimum}
                                        onChange={(e) => setFormData({ ...formData, stockMinimum: parseInt(e.target.value) })}
                                        className="input"
                                    />
                                </div>
                            </>
                        )}
                        <div>
                            <label className="label">Lagerort</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="input"
                                placeholder="z.B. Regal A1"
                            />
                        </div>
                        <div>
                            <label className="label">Lieferant</label>
                            <input
                                type="text"
                                value={formData.supplier}
                                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="label">Beschreibung</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="input"
                                rows={2}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Abbrechen
                        </Button>
                        <Button type="submit">
                            {editingProduct ? "Speichern" : "Erstellen"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Stock Modal */}
            <Modal
                isOpen={isStockModalOpen}
                onClose={() => setIsStockModalOpen(false)}
                title={`Bestand anpassen: ${stockProduct?.name}`}
                size="md"
            >
                <form onSubmit={handleStockSubmit} className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-500 mb-4">
                            Aktueller Bestand: <span className="font-semibold">{stockProduct?.stockCurrent} Stück</span>
                        </p>
                    </div>
                    <div>
                        <label className="label">Menge (+ für Zugang, - für Abgang)</label>
                        <input
                            type="number"
                            value={stockData.quantity}
                            onChange={(e) => setStockData({ ...stockData, quantity: parseInt(e.target.value) })}
                            className="input"
                            required
                        />
                    </div>
                    <div>
                        <label className="label">Grund</label>
                        <select
                            value={stockData.reason}
                            onChange={(e) => setStockData({ ...stockData, reason: e.target.value })}
                            className="input"
                        >
                            <option value="Einkauf">Einkauf</option>
                            <option value="Korrektur">Korrektur</option>
                            <option value="Inventur">Inventur</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Referenz (optional)</label>
                        <input
                            type="text"
                            value={stockData.reference}
                            onChange={(e) => setStockData({ ...stockData, reference: e.target.value })}
                            className="input"
                            placeholder="z.B. Lieferschein-Nr."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsStockModalOpen(false)}>
                            Abbrechen
                        </Button>
                        <Button type="submit">
                            Bestand aktualisieren
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

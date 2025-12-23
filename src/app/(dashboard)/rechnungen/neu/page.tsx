"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Search } from "lucide-react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import toast from "react-hot-toast";

interface Customer {
    id: string;
    name: string;
    company: string | null;
    address: string;
    zipCode: string;
    city: string;
}

interface Product {
    id: string;
    name: string;
    sellingPrice: number;
    stockCurrent: number;
}

interface InvoiceItem {
    productId: string | null;
    title: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface Settings {
    defaultDueDays: number;
    vatEnabled: boolean;
    defaultVatRate: number;
}

export default function NeueRechnungPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [customerSearch, setCustomerSearch] = useState("");

    const today = new Date().toISOString().split("T")[0];
    const defaultDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const [formData, setFormData] = useState({
        customerId: "",
        invoiceDate: today,
        deliveryDate: today,
        dueDate: defaultDueDate,
        discount: 0,
        shippingCost: 0,
        notes: "",
    });

    const [items, setItems] = useState<InvoiceItem[]>([
        { productId: null, title: "", quantity: 1, unitPrice: 0, totalPrice: 0 },
    ]);

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [customersRes, productsRes, settingsRes] = await Promise.all([
                fetch("/api/customers"),
                fetch("/api/products"),
                fetch("/api/settings"),
            ]);

            const customersData = await customersRes.json();
            const productsData = await productsRes.json();
            const settingsData = await settingsRes.json();

            setCustomers(customersData);
            setProducts(productsData);
            setSettings(settingsData);

            if (settingsData.defaultDueDays) {
                const newDueDate = new Date(
                    Date.now() + settingsData.defaultDueDays * 24 * 60 * 60 * 1000
                ).toISOString().split("T")[0];
                setFormData((prev) => ({ ...prev, dueDate: newDueDate }));
            }
        } catch {
            toast.error("Fehler beim Laden der Daten");
        }
    };

    const selectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setFormData({ ...formData, customerId: customer.id });
        setIsCustomerModalOpen(false);
    };

    const addItem = () => {
        setItems([...items, { productId: null, title: "", quantity: 1, unitPrice: 0, totalPrice: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length === 1) {
            toast.error("Mindestens eine Position erforderlich");
            return;
        }
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof InvoiceItem, value: string | number | null) => {
        const newItems = [...items];
        const item = { ...newItems[index], [field]: value };

        // Auto-fill from product
        if (field === "productId" && value) {
            const product = products.find((p) => p.id === value);
            if (product) {
                item.title = product.name;
                item.unitPrice = Number(product.sellingPrice);
            }
        }

        // Calculate total
        item.totalPrice = item.quantity * item.unitPrice;
        newItems[index] = item;
        setItems(newItems);
    };

    const calculateTotals = () => {
        const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
        const subtotal = itemsTotal - formData.discount + formData.shippingCost;
        const vatRate = settings?.vatEnabled ? Number(settings.defaultVatRate) : 0;
        const vatAmount = subtotal * (vatRate / 100);
        const total = subtotal + vatAmount;
        return { subtotal, vatRate, vatAmount, total };
    };

    const { subtotal, vatRate, vatAmount, total } = calculateTotals();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.customerId) {
            toast.error("Bitte wähle einen Kunden aus");
            return;
        }

        if (items.some((item) => !item.title || item.quantity < 1)) {
            toast.error("Bitte fülle alle Positionen aus");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    items: items.map((item) => ({
                        ...item,
                        productId: item.productId || null,
                    })),
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }

            const invoice = await res.json();
            toast.success("Rechnung erstellt");
            router.push(`/rechnungen/${invoice.id}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Fehler beim Erstellen");
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount);
    };

    const filteredCustomers = customers.filter(
        (c) =>
            c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
            c.company?.toLowerCase().includes(customerSearch.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Neue Rechnung</h1>
                <p className="page-subtitle">Erstelle eine neue Rechnung</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Section */}
                <div className="card">
                    <h2 className="text-lg font-semibold mb-4">Kunde</h2>
                    {selectedCustomer ? (
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-medium">{selectedCustomer.name}</p>
                                {selectedCustomer.company && (
                                    <p className="text-gray-500">{selectedCustomer.company}</p>
                                )}
                                <p className="text-sm text-gray-500">
                                    {selectedCustomer.address}, {selectedCustomer.zipCode} {selectedCustomer.city}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsCustomerModalOpen(true)}
                            >
                                Ändern
                            </Button>
                        </div>
                    ) : (
                        <Button type="button" variant="outline" onClick={() => setIsCustomerModalOpen(true)}>
                            <Search size={18} />
                            Kunde auswählen
                        </Button>
                    )}
                </div>

                {/* Dates Section */}
                <div className="card">
                    <h2 className="text-lg font-semibold mb-4">Daten</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="label">Rechnungsdatum *</label>
                            <input
                                type="date"
                                value={formData.invoiceDate}
                                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Lieferdatum</label>
                            <input
                                type="date"
                                value={formData.deliveryDate}
                                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">Fälligkeitsdatum *</label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Items Section */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Positionen</h2>
                        <Button type="button" variant="outline" size="sm" onClick={addItem}>
                            <Plus size={16} />
                            Position hinzufügen
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-12 gap-3 items-end p-4 bg-gray-50 rounded-lg dark:bg-gray-800/50"
                            >
                                <div className="col-span-12 md:col-span-3">
                                    <label className="label">Produkt (optional)</label>
                                    <select
                                        value={item.productId || ""}
                                        onChange={(e) => updateItem(index, "productId", e.target.value || null)}
                                        className="input"
                                    >
                                        <option value="">-- Freitext --</option>
                                        {products.map((product) => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} ({product.stockCurrent} verfügbar)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <label className="label">Bezeichnung *</label>
                                    <input
                                        type="text"
                                        value={item.title}
                                        onChange={(e) => updateItem(index, "title", e.target.value)}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-1">
                                    <label className="label">Menge</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <label className="label">Einzelpreis</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.unitPrice}
                                        onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div className="col-span-3 md:col-span-1 text-right">
                                    <label className="label">Gesamt</label>
                                    <p className="py-2.5 font-medium">{formatCurrency(item.totalPrice)}</p>
                                </div>
                                <div className="col-span-1">
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                                    >
                                        <Trash2 size={18} className="text-red-500" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Extras & Totals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4">Zusatzoptionen</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="label">Rabatt (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.discount}
                                    onChange={(e) =>
                                        setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })
                                    }
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">Versandkosten (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.shippingCost}
                                    onChange={(e) =>
                                        setFormData({ ...formData, shippingCost: parseFloat(e.target.value) || 0 })
                                    }
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">Notizen</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="input"
                                    rows={3}
                                    placeholder="Erscheint auf der Rechnung"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4">Zusammenfassung</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Zwischensumme</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            {settings?.vatEnabled && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">MwSt. ({vatRate}%)</span>
                                    <span>{formatCurrency(vatAmount)}</span>
                                </div>
                            )}
                            {!settings?.vatEnabled && (
                                <p className="text-sm text-gray-500 italic">
                                    Gemäß § 19 UStG wird keine MwSt. berechnet
                                </p>
                            )}
                            <div className="border-t pt-3 dark:border-gray-700">
                                <div className="flex justify-between text-lg font-semibold">
                                    <span>Gesamtbetrag</span>
                                    <span className="text-violet-600">{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Abbrechen
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        <Save size={18} />
                        Als Entwurf speichern
                    </Button>
                </div>
            </form>

            {/* Customer Selection Modal */}
            <Modal
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                title="Kunde auswählen"
                size="lg"
            >
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Suchen..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="input pl-10"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                        {filteredCustomers.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">Keine Kunden gefunden</p>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <button
                                    key={customer.id}
                                    type="button"
                                    onClick={() => selectCustomer(customer)}
                                    className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <p className="font-medium">{customer.name}</p>
                                    {customer.company && <p className="text-sm text-gray-500">{customer.company}</p>}
                                    <p className="text-sm text-gray-500">
                                        {customer.zipCode} {customer.city}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}

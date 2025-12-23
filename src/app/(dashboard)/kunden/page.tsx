"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Users, FileText } from "lucide-react";
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
    country: string;
    email: string | null;
    phone: string | null;
    vatId: string | null;
    notes: string | null;
    _count?: { invoices: number };
}

export default function KundenPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        company: "",
        address: "",
        zipCode: "",
        city: "",
        country: "Deutschland",
        email: "",
        phone: "",
        vatId: "",
        notes: "",
    });

    useEffect(() => {
        fetchCustomers();
    }, [search]);

    const fetchCustomers = async () => {
        try {
            const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
            const data = await res.json();
            setCustomers(data);
        } catch {
            toast.error("Fehler beim Laden der Kunden");
        } finally {
            setIsLoading(false);
        }
    };

    const openNewModal = () => {
        setEditingCustomer(null);
        setFormData({
            name: "",
            company: "",
            address: "",
            zipCode: "",
            city: "",
            country: "Deutschland",
            email: "",
            phone: "",
            vatId: "",
            notes: "",
        });
        setIsModalOpen(true);
    };

    const openEditModal = (customer: Customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            company: customer.company || "",
            address: customer.address,
            zipCode: customer.zipCode,
            city: customer.city,
            country: customer.country,
            email: customer.email || "",
            phone: customer.phone || "",
            vatId: customer.vatId || "",
            notes: customer.notes || "",
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : "/api/customers";
            const method = editingCustomer ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    company: formData.company || null,
                    email: formData.email || null,
                    phone: formData.phone || null,
                    vatId: formData.vatId || null,
                    notes: formData.notes || null,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }

            toast.success(editingCustomer ? "Kunde aktualisiert" : "Kunde erstellt");
            setIsModalOpen(false);
            fetchCustomers();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Fehler");
        }
    };

    const handleDelete = async (customer: Customer) => {
        if (!confirm(`Kunde "${customer.name}" wirklich löschen?`)) return;

        try {
            const res = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }
            toast.success("Kunde gelöscht");
            fetchCustomers();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Fehler");
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="page-title">Kunden</h1>
                    <p className="page-subtitle">Kundenverwaltung</p>
                </div>
                <Button onClick={openNewModal}>
                    <Plus size={18} />
                    Neuer Kunde
                </Button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Suchen nach Name, Firma, E-Mail..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-10"
                    />
                </div>
            </div>

            {/* Customers Table */}
            <div className="table-container bg-white dark:bg-gray-900">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Kunde</th>
                            <th>Adresse</th>
                            <th>Kontakt</th>
                            <th className="text-center">Rechnungen</th>
                            <th className="text-right">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-gray-500">
                                    Laden...
                                </td>
                            </tr>
                        ) : customers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-gray-500">
                                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    Keine Kunden gefunden
                                </td>
                            </tr>
                        ) : (
                            customers.map((customer) => (
                                <tr key={customer.id}>
                                    <td>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                                            {customer.company && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{customer.company}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="text-gray-600 dark:text-gray-400">
                                        <p>{customer.address}</p>
                                        <p>{customer.zipCode} {customer.city}</p>
                                    </td>
                                    <td className="text-gray-600 dark:text-gray-400">
                                        {customer.email && <p>{customer.email}</p>}
                                        {customer.phone && <p>{customer.phone}</p>}
                                    </td>
                                    <td className="text-center">
                                        <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                            <FileText size={14} />
                                            {customer._count?.invoices || 0}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(customer)}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                            >
                                                <Edit2 size={16} className="text-gray-500" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(customer)}
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

            {/* Customer Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCustomer ? "Kunde bearbeiten" : "Neuer Kunde"}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="label">Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="label">Firma</label>
                            <input
                                type="text"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="label">Adresse *</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">PLZ *</label>
                            <input
                                type="text"
                                value={formData.zipCode}
                                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Ort *</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Land</label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">USt-ID</label>
                            <input
                                type="text"
                                value={formData.vatId}
                                onChange={(e) => setFormData({ ...formData, vatId: e.target.value })}
                                className="input"
                                placeholder="z.B. DE123456789"
                            />
                        </div>
                        <div>
                            <label className="label">E-Mail</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">Telefon</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="label">Notizen</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                            {editingCustomer ? "Speichern" : "Erstellen"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

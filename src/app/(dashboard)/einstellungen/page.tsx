"use client";

import { useState, useEffect } from "react";
import { Save, Building2, Receipt, Percent } from "lucide-react";
import Button from "@/components/Button";
import toast from "react-hot-toast";

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
    invoicePrefix: string;
    invoiceYear: number;
    invoiceStartNumber: number;
    invoiceCurrentNumber: number;
    defaultDueDays: number;
    vatEnabled: boolean;
    defaultVatRate: number;
}

export default function EinstellungenPage() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings");
            const data = await res.json();
            setSettings(data);
        } catch {
            toast.error("Fehler beim Laden der Einstellungen");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);

        try {
            const res = await fetch("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            if (!res.ok) throw new Error("Fehler beim Speichern");

            toast.success("Einstellungen gespeichert");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Fehler");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !settings) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner border-violet-600" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="page-title">Einstellungen</h1>
                    <p className="page-subtitle">Firmen- und Anwendungskonfiguration</p>
                </div>
                <Button onClick={handleSave} isLoading={isSaving}>
                    <Save size={18} />
                    Speichern
                </Button>
            </div>

            <div className="space-y-6 max-w-4xl">
                {/* Company Info */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center dark:bg-violet-900/30">
                            <Building2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Firmendaten</h2>
                            <p className="text-sm text-gray-500">Diese Daten erscheinen auf deinen Rechnungen</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="label">Firmenname</label>
                            <input
                                type="text"
                                value={settings.companyName}
                                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="label">Adresse</label>
                            <input
                                type="text"
                                value={settings.address || ""}
                                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                className="input"
                                placeholder="Straße und Hausnummer"
                            />
                        </div>
                        <div>
                            <label className="label">PLZ</label>
                            <input
                                type="text"
                                value={settings.zipCode || ""}
                                onChange={(e) => setSettings({ ...settings, zipCode: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">Stadt</label>
                            <input
                                type="text"
                                value={settings.city || ""}
                                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">E-Mail</label>
                            <input
                                type="email"
                                value={settings.email || ""}
                                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">Telefon</label>
                            <input
                                type="tel"
                                value={settings.phone || ""}
                                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">Steuernummer</label>
                            <input
                                type="text"
                                value={settings.taxNumber || ""}
                                onChange={(e) => setSettings({ ...settings, taxNumber: e.target.value })}
                                className="input"
                                placeholder="z.B. 123/456/78901"
                            />
                        </div>
                    </div>
                </div>

                {/* Bank Info */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center dark:bg-emerald-900/30">
                            <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Bankverbindung</h2>
                            <p className="text-sm text-gray-500">Für Zahlungsinformationen auf Rechnungen</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="label">Bank</label>
                            <input
                                type="text"
                                value={settings.bankName || ""}
                                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">IBAN</label>
                            <input
                                type="text"
                                value={settings.iban || ""}
                                onChange={(e) => setSettings({ ...settings, iban: e.target.value })}
                                className="input"
                                placeholder="DE00 0000 0000 0000 0000 00"
                            />
                        </div>
                        <div>
                            <label className="label">BIC</label>
                            <input
                                type="text"
                                value={settings.bic || ""}
                                onChange={(e) => setSettings({ ...settings, bic: e.target.value })}
                                className="input"
                            />
                        </div>
                    </div>
                </div>

                {/* Invoice Settings */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center dark:bg-blue-900/30">
                            <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Rechnungseinstellungen</h2>
                            <p className="text-sm text-gray-500">Nummernkreis und Standardwerte</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="label">Prefix</label>
                            <input
                                type="text"
                                value={settings.invoicePrefix}
                                onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                                className="input"
                                placeholder="z.B. FF"
                            />
                        </div>
                        <div>
                            <label className="label">Jahr</label>
                            <input
                                type="number"
                                value={settings.invoiceYear}
                                onChange={(e) =>
                                    setSettings({ ...settings, invoiceYear: parseInt(e.target.value) })
                                }
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">Aktuelle Nummer</label>
                            <input
                                type="number"
                                value={settings.invoiceCurrentNumber}
                                onChange={(e) =>
                                    setSettings({ ...settings, invoiceCurrentNumber: parseInt(e.target.value) })
                                }
                                className="input"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Nächste Rechnung: {settings.invoicePrefix}-{settings.invoiceYear}-
                                {String(settings.invoiceCurrentNumber + 1).padStart(4, "0")}
                            </p>
                        </div>
                        <div>
                            <label className="label">Standard-Zahlungsziel (Tage)</label>
                            <input
                                type="number"
                                min="0"
                                max="365"
                                value={settings.defaultDueDays}
                                onChange={(e) =>
                                    setSettings({ ...settings, defaultDueDays: parseInt(e.target.value) })
                                }
                                className="input"
                            />
                        </div>
                    </div>
                </div>

                {/* VAT Settings */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center dark:bg-amber-900/30">
                            <Percent className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Umsatzsteuer</h2>
                            <p className="text-sm text-gray-500">MwSt.-Einstellungen für Rechnungen</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="vatEnabled"
                                checked={settings.vatEnabled}
                                onChange={(e) => setSettings({ ...settings, vatEnabled: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                            />
                            <label htmlFor="vatEnabled" className="font-medium">
                                Umsatzsteuer berechnen
                            </label>
                        </div>

                        {!settings.vatEnabled && (
                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                    <strong>Kleinunternehmer-Regelung aktiv:</strong> Auf allen Rechnungen wird der
                                    Hinweis &quot;Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.&quot; angezeigt.
                                </p>
                            </div>
                        )}

                        {settings.vatEnabled && (
                            <div className="max-w-xs">
                                <label className="label">Standard MwSt.-Satz (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={Number(settings.defaultVatRate)}
                                    onChange={(e) =>
                                        setSettings({ ...settings, defaultVatRate: parseFloat(e.target.value) })
                                    }
                                    className="input"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

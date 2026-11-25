"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    LayoutDashboard,
    Package,
    Users,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
} from "lucide-react";
import { useState } from "react";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Produkte", href: "/produkte", icon: Package },
    { name: "Kunden", href: "/kunden", icon: Users },
    { name: "Rechnungen", href: "/rechnungen", icon: FileText },
    { name: "Einstellungen", href: "/einstellungen", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Top Bar */}
            <div className="fixed inset-x-0 top-0 z-30 h-16 flex items-center justify-center bg-ink-50/90 backdrop-blur border-b border-ink-200/80 md:hidden">
                <span className="font-display italic text-[1.375rem] font-semibold text-ink-900">
                    Fräulein Franken
                </span>
            </div>

            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Menü schließen" : "Menü öffnen"}
                className="fixed top-3 left-4 z-50 p-2 rounded-full text-ink-700 bg-white border border-ink-200 shadow-sm md:hidden"
            >
                {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-ink-950/35 backdrop-blur-[2px] z-30 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#fffdfb] border-r border-ink-200/80 transform transition-transform duration-300 md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <Link
                        href="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex flex-col items-center px-6 pt-7 pb-5 border-b border-ink-200/80"
                    >
                        <Image
                            src="/logo-mark.png"
                            alt="Fräulein Franken – Geschenke für dich"
                            width={132}
                            height={132}
                            priority
                        />
                    </Link>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`sidebar-link ${isActive ? "active" : ""}`}
                                >
                                    <item.icon size={19} strokeWidth={isActive ? 2 : 1.75} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="px-4 py-4 border-t border-ink-200/80">
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="sidebar-link w-full text-ink-500 hover:bg-red-50 hover:text-red-700"
                        >
                            <LogOut size={19} strokeWidth={1.75} />
                            Abmelden
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

"use client";

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
    Gift,
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
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg md:hidden dark:bg-gray-800"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 md:translate-x-0 dark:bg-gray-900 dark:border-gray-800 ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <Gift className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 dark:text-white">Fräulein Franken</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Geschenke für dich</p>
                        </div>
                    </div>

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
                                    <item.icon size={20} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="sidebar-link w-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                            <LogOut size={20} />
                            Abmelden
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                toast.error("Ungültige E-Mail oder Passwort");
            } else {
                toast.success("Erfolgreich angemeldet!");
                router.push("/dashboard");
                router.refresh();
            }
        } catch {
            toast.error("Ein Fehler ist aufgetreten");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-ink-50 p-4 overflow-hidden">
            {/* Dezente Rosé-Flächen wie auf der Rechnung */}
            <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-brand-100/60" />
            <div aria-hidden className="pointer-events-none absolute -bottom-48 -right-32 w-[34rem] h-[34rem] rounded-full bg-brand-100/50" />

            <div className="relative w-full max-w-[26rem]">
                {/* Card */}
                <div className="bg-white rounded-3xl border border-ink-200/70 px-8 pb-8 pt-7 sm:px-10" style={{ boxShadow: "0 30px 80px -40px rgb(91 34 58 / 0.35)" }}>
                    {/* Logo & Title */}
                    <div className="text-center mb-7">
                        <Image
                            src="/logo-mark.png"
                            alt=""
                            width={176}
                            height={176}
                            priority
                            className="mx-auto"
                        />
                        <h1 className="sr-only">Fräulein Franken – Geschenke für dich</h1>
                        <p className="mt-3 font-display italic text-xl text-ink-600">
                            Schön, dass du da bist.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="label">
                                E-Mail
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-ink-400" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input pl-10"
                                    placeholder="name@beispiel.de"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="label">
                                Passwort
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-ink-400" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pl-10 pr-10"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary btn-lg w-full"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Anmeldung...
                                </>
                            ) : (
                                "Anmelden"
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-sm text-ink-500 mt-6">
                        Noch kein Konto? Kontaktiere den Admin.
                    </p>
                </div>

                {/* Bottom Branding */}
                <p className="text-center text-xs text-ink-400 mt-6">
                    © {new Date().getFullYear()} Fräulein Franken – Alle Rechte vorbehalten
                </p>
            </div>
        </div>
    );
}

import Sidebar from "@/components/Sidebar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-ink-50">
            <Sidebar />
            <main className="md:ml-64 min-h-screen">
                <div className="px-4 pt-20 pb-10 md:px-10 md:pt-10 lg:px-12">
                    {children}
                </div>
            </main>
        </div>
    );
}

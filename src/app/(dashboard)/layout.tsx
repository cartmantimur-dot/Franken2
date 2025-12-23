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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Sidebar />
            <main className="md:ml-64 min-h-screen">
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

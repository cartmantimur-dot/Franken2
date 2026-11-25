"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
    return (
        <Toaster
            position="bottom-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: "#27211e",
                    color: "#fff",
                    borderRadius: "14px",
                    fontSize: "14px",
                    boxShadow: "0 12px 30px -12px rgb(39 33 30 / 0.45)",
                    padding: "12px 16px",
                },
                success: {
                    iconTheme: {
                        primary: "#82a786",
                        secondary: "#fff",
                    },
                },
                error: {
                    iconTheme: {
                        primary: "#cd7365",
                        secondary: "#fff",
                    },
                },
            }}
        />
    );
}

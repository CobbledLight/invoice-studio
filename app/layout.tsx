import type { Metadata } from "next";
import "./globals.css";
import "./studio.css";
import { LocaleProvider } from "@/lib/locale";
export const metadata: Metadata = {
    title: "Invoice Studio",
    description: "Your invoices, customers and business details in one workspace.",
    icons: {
        icon: "/favicon.svg",
        shortcut: "/favicon.svg",
    },
};
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>) {
        return (<html lang="en">
            <body className="antialiased"><LocaleProvider>{children}</LocaleProvider></body>
    </html>);
}

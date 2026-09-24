import type { Metadata, Viewport } from "next";
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
export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>) {
        return (<html lang="en">
            <body className="antialiased"><LocaleProvider>{children}</LocaleProvider></body>
    </html>);
}

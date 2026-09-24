import type { Metadata } from "next";
import "./globals.css";
import "./studio.css";
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
      <body className="antialiased">{children}</body>
    </html>);
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@aws-amplify/ui-react/styles.css";

export const metadata: Metadata = {
  title: "PDF Maker",
  description: "Convert markdown to professionally styled PDFs with SMEC AI branding",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}

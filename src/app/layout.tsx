import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "PureWork Family",
  description: "Aplikasi Pohon Keluarga Digital",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="font-nunito antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

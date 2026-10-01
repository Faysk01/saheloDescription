import type { Metadata } from "next";
import { Merriweather, Public_Sans } from "next/font/google";
import "./globals.css";

// Importation optimisée des polices
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Portail Administratif & Opérationnel - SaheloPay",
  description: "Suivi du projet FinTech",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body
        className={`${publicSans.variable} ${merriweather.variable} font-sans h-screen flex flex-col md:flex-row overflow-hidden selection:bg-desert-accent selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
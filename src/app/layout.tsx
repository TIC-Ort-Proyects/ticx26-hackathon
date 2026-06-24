import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TutorIAs — Tu tutor de IA personal",
  description:
    "TutorIAs: una plataforma educativa impulsada por IA que enseña cualquier tema a través de lo que más te gusta, y detecta cuándo perdés la motivación para ayudarte a seguir.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

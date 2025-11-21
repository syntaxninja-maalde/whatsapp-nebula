import React from "react";
import "./globals.css";

export const metadata = {
  title: "WhatsBiz Nebula",
  description: "Next.js WhatsApp Business Client",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="font-sans bg-nebula-dark min-h-screen text-glass-text">
      <div className="stars"></div>
      {children}
    </div>
  );
}

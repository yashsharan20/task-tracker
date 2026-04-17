// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "TaskTracker",
  description: "Minimal task management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#18181b",
                color: "#fafafa",
                border: "1px solid #27272a",
                borderRadius: "8px",
                fontSize: "14px",
              },
              success: { iconTheme: { primary: "#6366f1", secondary: "#fafafa" } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}

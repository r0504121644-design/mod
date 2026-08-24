import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import StoreHydration from "@/components/StoreHydration";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: "לב המעבר | בינה מעברית",
  description: "הבית הדיגיטלי למטפלים המשפחתיים של הורים מבוגרים",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={rubik.variable}>
      <body className="font-sans bg-cream text-navy antialiased">
        <StoreHydration>{children}</StoreHydration>
      </body>
    </html>
  );
}

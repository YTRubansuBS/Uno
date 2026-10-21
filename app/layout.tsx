import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scroll Game — Swipe. Play. Repeat.",
  description: "Un feed vertical de mini-jeux jouables instantanément. Scroll, joue, bats ton record et découvre le prochain jeu."
};
export const viewport: Viewport = { width:"device-width", initialScale:1, maximumScale:1, userScalable:false, colorScheme:"dark", themeColor:"#050506" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fr"><body>{children}</body></html>; }

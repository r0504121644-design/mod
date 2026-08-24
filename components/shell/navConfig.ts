import { LayoutDashboard, CalendarClock, Pill, Activity, Stethoscope, FolderHeart } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "דאשבורד", icon: LayoutDashboard },
  { href: "/shifts", label: "תורנויות", icon: CalendarClock },
  { href: "/medications", label: "תרופות", icon: Pill },
  { href: "/vitals", label: "מדדים", icon: Activity },
  { href: "/appointments", label: "תורים ואשפוזים", icon: Stethoscope },
  { href: "/documents", label: "מסמכים ואנשי קשר", icon: FolderHeart },
];

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Newspaper,
  Calendar,
  Radio,
  Trophy,
  Table,
  Users,
  Ticket,
  ScanLine,
  CreditCard,
  ShoppingBag,
  HeartHandshake,
  Award,
  Briefcase,
  Gift,
  Bell,
  FileBarChart2,
  FileText,
  Languages,
  UserCog,
  History,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { ClubCrest } from '@/components/ui/ClubCrest';

export const ADMIN_NAV_MODULES = [
  { href: '/admin/dashboard', label: '1. Overview', icon: LayoutDashboard },
  { href: '/admin/news', label: '2. News & Media', icon: Newspaper },
  { href: '/admin/fixtures', label: '3. Fixtures', icon: Calendar },
  { href: '/admin/match-centre', label: '4. Match Centre', icon: Radio },
  { href: '/admin/results', label: '5. Results', icon: Trophy },
  { href: '/admin/table', label: '6. League Table', icon: Table },
  { href: '/admin/squad', label: '7. Squad & Staff', icon: Users },
  { href: '/admin/tickets', label: '8. Tickets', icon: Ticket },
  { href: '/admin/gate', label: '9. Gate Scanning', icon: ScanLine },
  { href: '/admin/payments', label: '10. Orders & Payments', icon: CreditCard },
  { href: '/admin/merchandise', label: '11. Merchandise & Inventory', icon: ShoppingBag },
  { href: '/admin/memberships', label: '12. Supporters & Membership', icon: HeartHandshake },
  { href: '/admin/loyalty', label: '13. Loyalty Programme', icon: Award },
  { href: '/admin/sponsors', label: '14. Sponsors & Partners', icon: Briefcase },
  { href: '/admin/donations', label: '15. Donations', icon: Gift },
  { href: '/admin/notifications', label: '16. Notifications', icon: Bell },
  { href: '/admin/reports', label: '17. Reports', icon: FileBarChart2 },
  { href: '/admin/pages', label: '18. Website Pages', icon: FileText },
  { href: '/admin/languages', label: '19. Languages', icon: Languages },
  { href: '/admin/users', label: '20. Users & Roles', icon: UserCog },
  { href: '/admin/audit-logs', label: '21. Audit Logs', icon: History },
  { href: '/admin/settings', label: '22. Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0D1117] text-slate-300 border-r border-white/10 flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <ClubCrest size="sm" />
            <div>
              <span className="font-display font-extrabold text-white text-sm block leading-none">
                3K FC Back-Office
              </span>
              <span className="text-[10px] text-club-accent font-bold uppercase tracking-wider">
                Embu, Kenya
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation List */}
        <nav aria-label="Admin Navigation" className="p-3 space-y-1">
          {ADMIN_NAV_MODULES.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  active
                    ? 'bg-club-primary text-white shadow'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Switch to Public Site */}
      <div className="p-4 border-t border-white/10 bg-[#090D13]">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between text-xs text-slate-400 hover:text-white transition"
        >
          <span>View Public Platform</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  );
}

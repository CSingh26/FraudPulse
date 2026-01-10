'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, AlertTriangle, LayoutDashboard, ReceiptText } from 'lucide-react';

import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { href: '/transactions', label: 'Transactions', icon: ReceiptText },
  { href: '/model', label: 'Model', icon: Activity },
];

export const SideNav = () => {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 px-4">
      {navItems.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition',
              active
                ? 'bg-slate-900 text-white shadow-sm'
                : 'hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

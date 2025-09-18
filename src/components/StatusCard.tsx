'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

interface StatusCardProps {
  title: string;
  value: string | ReactNode;
  icon: ReactNode;
  clickable?: boolean;
  href?: string;
}

export function StatusCard({ title, value, icon, clickable = false, href }: StatusCardProps) {
  const cardContent = (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
            <div className="text-lg font-medium text-gray-900 dark:text-white">
              {value}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (clickable && href) {
    return (
      <Link
        href={href}
        className="block hover:shadow-lg transition-all duration-150 ease-in-out cursor-pointer"
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
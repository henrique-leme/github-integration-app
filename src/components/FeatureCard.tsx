'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  status: ReactNode;
  footer: string;
  href: string;
}

export function FeatureCard({ title, description, icon, status, footer, href }: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-lg transition-all duration-150 ease-in-out transform hover:-translate-y-1 cursor-pointer"
    >
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
            <div className="mt-3">
              {status}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
        <div className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
          {footer}
        </div>
      </div>
    </Link>
  );
}
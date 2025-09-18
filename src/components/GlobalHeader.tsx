'use client';

import { ThemeToggle } from "@/components/ThemeToggle";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function GlobalHeader() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {session && (
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
}
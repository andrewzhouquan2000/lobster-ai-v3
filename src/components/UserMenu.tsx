'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserMenuProps {
  user: {
    email: string;
    display_name?: string | null;
    avatar_url?: string | null;
  };
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayName = user.display_name || user.email.split('@')[0];
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={displayName}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] flex items-center justify-center text-white text-sm font-medium">
            {initials}
          </div>
        )}
        <span className="text-sm text-gray-300 hidden sm:inline">{displayName}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#1A1A2E] border border-white/10 shadow-xl z-20">
            <div className="p-3 border-b border-white/10">
              <p className="text-sm font-medium text-white">{displayName}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/settings');
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 transition-colors"
              >
                ⚙️ 设置
              </button>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-white/5 transition-colors"
              >
                {loading ? '退出中...' : '🚪 退出登录'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
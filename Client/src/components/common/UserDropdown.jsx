import { ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.jsx';

function truncateEmail(email = '') {
  if (!email) return '';

  const [local, domain] = email.split('@');

  if (!local || !domain) return email;

  const shortLocal =
    local.length > 10 ? `${local.slice(0, 10)}...` : local;

  return `${shortLocal}@${domain}`;
}

export default function UserDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;

      if (!ref.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', onDoc);

    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName =
    user?.displayName ||
    user?.name ||
    user?.username ||
    'You';

  const handle = user?.username
    ? `@${user.username}`
    : '';

  return (
    <div className="relative" ref={ref}>
      {/* Navbar Button */}

      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        className="flex items-center gap-3 border-2 border-border bg-[#0f131b] px-3 py-2 text-primaryText shadow-panel"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border bg-background font-black uppercase">
          {displayName.charAt(0)}
        </div>

        <span className="hidden max-w-[140px] truncate text-sm font-black uppercase tracking-[0.12em] sm:block">
          {displayName}
        </span>

        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          strokeWidth={2.25}
        />
      </button>

      {/* Dropdown */}

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden border-2 border-border bg-[#0f131b] shadow-panel">

          {/* Header */}

          <div className="flex items-center gap-4 p-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-border bg-background text-lg font-black uppercase text-primaryText">
              {displayName.charAt(0)}
            </div>

            <div className="min-w-0 flex-1">

              <p className="truncate text-sm font-black uppercase tracking-[0.12em] text-primaryText">
                {displayName}
              </p>

              <p className="mt-1 truncate text-[11px] uppercase tracking-[0.12em] text-secondaryText">
                {truncateEmail(user?.email)}
              </p>

              {handle && (
                <p className="mt-1 truncate text-[11px] uppercase tracking-[0.12em] text-groupBlue">
                  {handle}
                </p>
              )}

            </div>

          </div>

          <div className="border-t-2 border-border" />

          {/* Menu */}

          <div className="p-2">

            <button
              className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm font-bold uppercase tracking-[0.12em] text-primaryText transition-colors hover:bg-white/5"
            >
              <User
                className="h-4 w-4"
                strokeWidth={2.25}
              />

              Profile
            </button>

            <button
              className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm font-bold uppercase tracking-[0.12em] text-primaryText transition-colors hover:bg-white/5"
            >
              <Settings
                className="h-4 w-4"
                strokeWidth={2.25}
              />

              Preferences
            </button>

          </div>

          <div className="border-t-2 border-border" />

          {/* Logout */}

          <div className="p-2">

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm font-bold uppercase tracking-[0.12em] text-primaryText transition-colors hover:bg-red-500/10"
            >
              <LogOut
                className="h-4 w-4"
                strokeWidth={2.25}
              />

              Logout
            </button>

          </div>

        </div>
      )}
    </div>
  );
}
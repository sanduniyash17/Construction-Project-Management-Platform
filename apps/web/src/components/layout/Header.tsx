function Header() {
  return (
    <header className="fixed top-0 right-0 left-64 z-10 h-16 border-b border-slate-200 bg-white">
      <div className="flex h-full items-center justify-between px-8">
        <div>
          <p className="text-sm text-slate-500">Construction Management</p>
          <h2 className="font-semibold text-slate-900">Overview</h2>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Notifications"
          >
            🔔
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              BF
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-900">
                BuildFlow User
              </p>
              <p className="text-xs text-slate-500">Project Manager</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
import { useAuth } from '../../contexts/AuthContext'
import { useSidebar } from '../../contexts/SidebarContext'

export default function Topbar({ title, subtitle, actions }) {
  const { profile } = useAuth()
  const { setSidebarOpen } = useSidebar()

  return (
    <header className="bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 -ml-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg flex-shrink-0"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-gray-900 truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs md:text-sm text-gray-500 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          {actions}
          {/* Notification Bell */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}

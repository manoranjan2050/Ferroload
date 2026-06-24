import { NavLink, Outlet } from 'react-router-dom'
import { Download, Rss, Settings, Bot, BarChart2, Sun, Moon } from 'lucide-react'
import { useSettingsStore } from '../stores/settingsStore'
import { cn } from '../lib/utils'

const navItems = [
  { to: '/', icon: Download, label: 'Torrents', exact: true },
  { to: '/rss', icon: Rss, label: 'RSS' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  const { theme, setTheme, aiAvailable } = useSettingsStore()

  return (
    <div className="flex h-screen bg-background text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-16 flex flex-col items-center py-4 gap-1 bg-surface border-r border-white/5 shrink-0">
        <div className="mb-4 w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg select-none">
          F
        </div>
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            title={label}
            className={({ isActive }) =>
              cn(
                'w-10 h-10 flex items-center justify-center rounded-lg transition-colors',
                isActive ? 'bg-primary text-white' : 'text-white/40 hover:text-white hover:bg-white/5'
              )
            }
          >
            <Icon size={20} />
          </NavLink>
        ))}
        <div className="flex-1" />
        {aiAvailable && (
          <NavLink
            to="/ai"
            title="AI Assistant"
            className={({ isActive }) =>
              cn(
                'w-10 h-10 flex items-center justify-center rounded-lg transition-colors',
                isActive ? 'bg-primary text-white' : 'text-white/40 hover:text-white hover:bg-white/5'
              )
            }
          >
            <Bot size={20} />
          </NavLink>
        )}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, LayoutDashboard, Upload, Brain, PenTool, BarChart3, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Locale } from '@/app/[lang]/dictionaries'
import { Chatbot } from './chatbot'

interface Props {
  dict: Record<string, any>
  lang: Locale
  profile: any
  children: React.ReactNode
}

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { key: 'progress', icon: BarChart3, path: '/dashboard/progress' },
  { key: 'materials', icon: Upload, path: '/dashboard/materials' },
  { key: 'flashcards', icon: Brain, path: '/dashboard/flashcards' },
  { key: 'settings', icon: Settings, path: '/dashboard/settings' },
]

export function DashboardShell({ dict, lang, profile, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${lang}`)
  }

  return (
    <div className="dash-layout">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-top">
          <Link href={`/${lang}`} className="dash-logo">
            <div className="dash-logo-icon"><BookOpen size={18} /></div>
            <span>SFI Tutor</span>
          </Link>

          <nav className="dash-nav">
            {navItems.map((item) => {
              const fullPath = `/${lang}${item.path}`
              const active = pathname === fullPath
              return (
                <Link
                  key={item.key}
                  href={fullPath}
                  className={`dash-nav-item ${active ? 'active' : ''}`}
                >
                  <item.icon size={18} />
                  <span>{dict.nav[item.key] || item.key}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="dash-sidebar-bottom">
          <div className="dash-user-info">
            <div className="dash-user-level">{profile?.current_level?.replace('_', ' ').toUpperCase()}</div>
            <div className="dash-user-target">→ {profile?.target_level?.replace('_', ' ').toUpperCase()}</div>
          </div>
          <button onClick={handleLogout} className="dash-nav-item dash-logout">
            <LogOut size={18} />
            <span>{dict.nav.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="dash-main">
        {children}
      </div>
      
      <Chatbot lang={lang} dict={dict} />

      <style jsx>{`
        .dash-layout {
          display: flex;
          min-height: 100vh;
          padding-top: 64px;
        }
        .dash-sidebar {
          width: 250px;
          border-right: 1px solid var(--border);
          background: var(--card);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: fixed;
          top: 64px;
          left: 0;
          bottom: 0;
          padding: 1.5rem 0.75rem;
          overflow-y: auto;
          z-index: 40;
        }
        .dash-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0 0.75rem;
          margin-bottom: 1.5rem;
          text-decoration: none;
          color: var(--foreground);
          font-weight: 700;
          font-size: 1rem;
        }
        .dash-logo-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700));
          border-radius: var(--radius-md);
          color: white;
        }
        .dash-nav {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .dash-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--muted-foreground);
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: all 0.15s ease;
          border: none;
          background: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
        }
        .dash-nav-item:hover {
          color: var(--foreground);
          background: var(--muted);
        }
        .dash-nav-item.active {
          color: var(--color-primary-600);
          background: rgba(51, 153, 255, 0.08);
          font-weight: 600;
        }
        .dash-user-info {
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          background: var(--muted);
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
        }
        .dash-user-level {
          font-weight: 700;
          font-size: 0.875rem;
        }
        .dash-user-target {
          color: var(--muted-foreground);
          margin-top: 0.125rem;
        }
        .dash-logout {
          color: var(--muted-foreground);
        }
        .dash-logout:hover {
          color: #ef4444;
        }
        .dash-main {
          flex: 1;
          margin-left: 250px;
          padding: 2rem;
          min-height: calc(100vh - 64px);
        }
        @media (max-width: 768px) {
          .dash-sidebar {
            display: none;
          }
          .dash-main {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  )
}

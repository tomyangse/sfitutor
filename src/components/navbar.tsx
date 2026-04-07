'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Globe, Menu, X, BookOpen } from 'lucide-react'
import type { Locale } from '@/app/[lang]/dictionaries'

interface NavbarProps {
  dict: {
    nav: {
      home: string
      login: string
      signup: string
    }
    common: {
      language: string
    }
  }
  lang: Locale
}

export function Navbar({ dict, lang }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  const switchLocale = lang === 'en' ? 'zh' : 'en'
  const switchLabel = lang === 'en' ? '中文' : 'English'

  // Replace current locale prefix in path
  const switchedPath = pathname.replace(`/${lang}`, `/${switchLocale}`)

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link href={`/${lang}`} className="navbar-logo">
          <div className="navbar-logo-icon">
            <BookOpen size={20} />
          </div>
          <span className="navbar-logo-text">
            SFI <span className="gradient-text">Tutor</span>
          </span>
        </Link>

        {/* Desktop actions */}
        <div className="navbar-actions">
          <Link href={switchedPath} className="navbar-lang-btn" title={dict.common.language}>
            <Globe size={16} />
            <span>{switchLabel}</span>
          </Link>
          <Link href={`/${lang}/login`} className="btn btn-secondary navbar-login-btn">
            {dict.nav.login}
          </Link>
          <Link href={`/${lang}/signup`} className="btn btn-primary navbar-signup-btn">
            {dict.nav.signup}
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="navbar-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="navbar-mobile-menu">
          <Link href={switchedPath} className="navbar-mobile-link" onClick={() => setMobileOpen(false)}>
            <Globe size={16} /> {switchLabel}
          </Link>
          <Link href={`/${lang}/login`} className="navbar-mobile-link" onClick={() => setMobileOpen(false)}>
            {dict.nav.login}
          </Link>
          <Link href={`/${lang}/signup`} className="btn btn-primary navbar-mobile-cta" onClick={() => setMobileOpen(false)}>
            {dict.nav.signup}
          </Link>
        </div>
      )}

      <style jsx>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: rgba(var(--background-rgb, 255, 255, 255), 0.8);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
        }
        @media (prefers-color-scheme: dark) {
          .navbar {
            background: rgba(9, 9, 11, 0.85);
          }
        }
        .navbar-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          text-decoration: none;
          color: var(--foreground);
        }
        .navbar-logo-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700));
          border-radius: var(--radius-md);
          color: white;
        }
        .navbar-logo-text {
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .navbar-lang-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: var(--muted-foreground);
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: all 0.15s ease;
        }
        .navbar-lang-btn:hover {
          color: var(--foreground);
          background: var(--muted);
        }
        .navbar-login-btn {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }
        .navbar-signup-btn {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }
        .navbar-mobile-toggle {
          display: none;
          background: none;
          border: none;
          color: var(--foreground);
          cursor: pointer;
          padding: 0.5rem;
        }
        .navbar-mobile-menu {
          display: none;
          flex-direction: column;
          padding: 1rem 1.5rem 1.5rem;
          gap: 0.5rem;
          border-top: 1px solid var(--border);
        }
        .navbar-mobile-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 0;
          color: var(--foreground);
          text-decoration: none;
          font-size: 1rem;
        }
        .navbar-mobile-cta {
          margin-top: 0.5rem;
          width: 100%;
          text-align: center;
        }
        @media (max-width: 768px) {
          .navbar-actions {
            display: none;
          }
          .navbar-mobile-toggle {
            display: block;
          }
          .navbar-mobile-menu {
            display: flex;
          }
        }
      `}</style>
    </nav>
  )
}

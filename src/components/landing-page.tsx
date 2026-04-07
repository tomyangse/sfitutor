'use client'

import Link from 'next/link'
import {
  BookOpen, Upload, Brain, PenTool, MessageCircle,
  BarChart3, ChevronRight, Sparkles, ArrowRight
} from 'lucide-react'
import type { Locale } from '@/app/[lang]/dictionaries'

interface LandingPageProps {
  dict: Record<string, any>
  lang: Locale
}

const levels = [
  { id: 'sfi-c', label: 'SFI C', cefr: 'A1-A2', color: '#22c55e' },
  { id: 'sfi-d', label: 'SFI D', cefr: 'A2-B1', color: '#3b82f6' },
  { id: 'sas-grund', label: 'SAS Grund', cefr: 'B1-B2', color: '#8b5cf6' },
  { id: 'sas-1', label: 'SAS 1', cefr: 'B2', color: '#f59e0b' },
  { id: 'sas-2', label: 'SAS 2', cefr: 'B2-C1', color: '#ef4444' },
  { id: 'sas-3', label: 'SAS 3', cefr: 'C1', color: '#ec4899' },
]

const featureIcons = [
  BookOpen, Upload, Brain, PenTool, MessageCircle, BarChart3
]

export function LandingPage({ dict, lang }: LandingPageProps) {
  const features = [
    dict.landing.features.smartPlan,
    dict.landing.features.materials,
    dict.landing.features.flashcards,
    dict.landing.features.writing,
    dict.landing.features.telegram,
    dict.landing.features.progress,
  ]

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>{dict.landing.badge}</span>
          </div>

          <h1 className="hero-title">
            {dict.landing.title}{' '}
            <span className="gradient-text">{dict.landing.titleHighlight}</span>
          </h1>

          <p className="hero-subtitle">
            {dict.landing.subtitle}
          </p>

          <div className="hero-actions">
            <Link href={`/${lang}/signup`} className="btn btn-primary btn-lg">
              {dict.landing.cta}
              <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn btn-secondary btn-lg">
              {dict.landing.ctaSecondary}
            </a>
          </div>

          {/* Stats row */}
          <div className="hero-stats">
            {[
              { value: dict.landing.stats.levels, desc: dict.landing.stats.levelsDesc },
              { value: dict.landing.stats.skills, desc: dict.landing.stats.skillsDesc },
              { value: dict.landing.stats.ai, desc: dict.landing.stats.aiDesc },
            ].map((stat, i) => (
              <div key={i} className="hero-stat">
                <div className="hero-stat-value">{stat.value}</div>
                <div className="hero-stat-desc">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">{dict.landing.features.title}</h2>
            <p className="section-subtitle">{dict.landing.features.subtitle}</p>
          </div>

          <div className="features-grid">
            {features.map((feature, i) => {
              const Icon = featureIcons[i]
              return (
                <div
                  key={i}
                  className="feature-card"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="feature-icon">
                    <Icon size={24} />
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-desc">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Levels Section */}
      <section className="levels-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">{dict.landing.levels.title}</h2>
            <p className="section-subtitle">{dict.landing.levels.subtitle}</p>
          </div>

          <div className="levels-track">
            {levels.map((level, i) => (
              <div key={level.id} className="level-item">
                <div
                  className="level-dot"
                  style={{ background: level.color, boxShadow: `0 0 20px ${level.color}40` }}
                />
                {i < levels.length - 1 && <div className="level-connector" />}
                <div className="level-label">{level.label}</div>
                <div className="level-cefr">{level.cefr}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <div className="cta-card">
            <h2 className="cta-title">{dict.landing.ctaSection.title}</h2>
            <p className="cta-subtitle">{dict.landing.ctaSection.subtitle}</p>
            <Link href={`/${lang}/signup`} className="btn btn-primary btn-lg">
              {dict.landing.ctaSection.cta}
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="section-container footer-inner">
          <div className="footer-logo">
            <BookOpen size={20} />
            <span>SFI Tutor</span>
          </div>
          <p className="footer-copy">© 2026 SFI Tutor. Built with AI.</p>
        </div>
      </footer>

      <style jsx>{`
        /* Hero */
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6rem 1.5rem 4rem;
          overflow: hidden;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(ellipse at 30% 20%, rgba(51, 153, 255, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse at 70% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 50%, rgba(245, 158, 11, 0.05) 0%, transparent 70%);
        }
        @media (prefers-color-scheme: dark) {
          .hero-bg {
            background: 
              radial-gradient(ellipse at 30% 20%, rgba(51, 153, 255, 0.15) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 60%),
              radial-gradient(ellipse at 50% 50%, rgba(245, 158, 11, 0.06) 0%, transparent 70%);
          }
        }
        .hero-content {
          position: relative;
          max-width: 800px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-primary-600);
          background: rgba(51, 153, 255, 0.08);
          border: 1px solid rgba(51, 153, 255, 0.15);
          border-radius: 999px;
          letter-spacing: 0.02em;
        }
        @media (prefers-color-scheme: dark) {
          .hero-badge {
            color: var(--color-primary-400);
            background: rgba(51, 153, 255, 0.1);
            border-color: rgba(51, 153, 255, 0.2);
          }
        }
        .hero-title {
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }
        .hero-subtitle {
          font-size: 1.125rem;
          line-height: 1.7;
          color: var(--muted-foreground);
          max-width: 600px;
        }
        .hero-actions {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        .hero-stats {
          display: flex;
          gap: 3rem;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border);
        }
        .hero-stat {
          text-align: center;
        }
        .hero-stat-value {
          font-size: 1.125rem;
          font-weight: 700;
        }
        .hero-stat-desc {
          font-size: 0.8125rem;
          color: var(--muted-foreground);
          margin-top: 0.25rem;
        }

        /* Sections */
        .section-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        .section-header {
          text-align: center;
          margin-bottom: 4rem;
        }
        .section-title {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .section-subtitle {
          font-size: 1.0625rem;
          color: var(--muted-foreground);
          margin-top: 0.75rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        /* Features */
        .features-section {
          padding: 6rem 0;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 900px) {
          .features-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr; }
        }
        .feature-card {
          padding: 2rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
          background: var(--card);
          transition: all 0.3s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(51, 153, 255, 0.3);
          box-shadow: 0 12px 40px rgba(51, 153, 255, 0.08);
        }
        .feature-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(51, 153, 255, 0.1), rgba(139, 92, 246, 0.1));
          border-radius: var(--radius-lg);
          color: var(--color-primary-500);
          margin-bottom: 1.25rem;
        }
        .feature-title {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .feature-desc {
          font-size: 0.9375rem;
          line-height: 1.6;
          color: var(--muted-foreground);
        }

        /* Levels */
        .levels-section {
          padding: 6rem 0;
          background: var(--muted);
        }
        .levels-track {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 0;
          padding: 2rem 0;
        }
        .level-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex: 1;
          max-width: 160px;
        }
        .level-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          position: relative;
          z-index: 2;
        }
        .level-connector {
          position: absolute;
          top: 12px;
          left: calc(50% + 12px);
          right: calc(-50% + 12px);
          height: 2px;
          background: var(--border);
          z-index: 1;
        }
        .level-label {
          font-size: 1rem;
          font-weight: 700;
          margin-top: 1rem;
        }
        .level-cefr {
          font-size: 0.8125rem;
          color: var(--muted-foreground);
          margin-top: 0.25rem;
        }
        @media (max-width: 600px) {
          .levels-track {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
            padding-left: 2rem;
          }
          .level-item {
            flex-direction: row;
            gap: 1rem;
            max-width: none;
          }
          .level-connector {
            display: none;
          }
        }

        /* CTA */
        .cta-section {
          padding: 6rem 0;
        }
        .cta-card {
          text-align: center;
          padding: 4rem 2rem;
          border-radius: var(--radius-2xl);
          background: linear-gradient(135deg, rgba(51, 153, 255, 0.05), rgba(139, 92, 246, 0.05));
          border: 1px solid rgba(51, 153, 255, 0.15);
        }
        @media (prefers-color-scheme: dark) {
          .cta-card {
            background: linear-gradient(135deg, rgba(51, 153, 255, 0.08), rgba(139, 92, 246, 0.08));
          }
        }
        .cta-title {
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .cta-subtitle {
          font-size: 1.0625rem;
          color: var(--muted-foreground);
          margin: 1rem auto 2rem;
          max-width: 500px;
          line-height: 1.6;
        }

        /* Footer */
        .footer {
          padding: 2rem 0;
          border-top: 1px solid var(--border);
        }
        .footer-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          color: var(--foreground);
        }
        .footer-copy {
          font-size: 0.8125rem;
          color: var(--muted-foreground);
        }
        @media (max-width: 600px) {
          .footer-inner {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
          .hero-stats {
            gap: 1.5rem;
          }
        }
      `}</style>
    </>
  )
}

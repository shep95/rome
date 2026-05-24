import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthModal } from "@/components/ui/auth-modal";
import { GlassmorphismHeader } from "@/components/ui/glassmorphism-header";
import { useAuth } from '@/hooks/useAuth';
import { ArrowUpRight } from 'lucide-react';
import landingBg from '@/assets/landing-bg.jpg';

const geist = { fontFamily: 'Geist, Inter, sans-serif' } as const;
const serif = { fontFamily: '"Instrument Serif", serif' } as const;
const mono = { fontFamily: '"JetBrains Mono", monospace' } as const;

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [time, setTime] = useState('');
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && !loading) navigate('/dashboard');
  }, [user, loading, navigate]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(
        d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
          ' UTC' +
          (-d.getTimezoneOffset() / 60 >= 0 ? '+' : '') +
          -d.getTimezoneOffset() / 60
      );
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  const handleAuthSuccess = () => navigate('/dashboard');

  return (
    <div className="relative min-h-screen w-full bg-[#0a0a0a] text-white overflow-x-hidden" style={geist}>
      {/* Background layers */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center transition-transform duration-700 ease-out"
        style={{
          backgroundImage: `url(${landingBg})`,
          transform: `scale(1.08) translate(${(mouse.x - 0.5) * -20}px, ${(mouse.y - 0.5) * -20}px)`,
        }}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#0a0a0a]/60 via-[#0a0a0a]/40 to-[#0a0a0a]" aria-hidden="true" />
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_30%,transparent_0%,#0a0a0a_85%)] opacity-80" aria-hidden="true" />
      {/* Subtle film grain */}
      <div
        className="fixed inset-0 z-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
        aria-hidden="true"
      />

      <GlassmorphismHeader onSignUpClick={() => setIsAuthModalOpen(true)} />

      {/* HERO — editorial split */}
      <section ref={heroRef} className="relative z-10 min-h-screen flex flex-col">
        {/* Top status bar */}
        <div className="pt-28 px-8 md:px-16 flex justify-between items-center text-[10px] tracking-[0.3em] uppercase text-white/40" style={mono}>
          <span>◉ Live · v27.04 · Encrypted</span>
          <span>{time || '--:--:-- UTC+0'}</span>
        </div>

        {/* Main hero block */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 py-16">
          <div className="max-w-[1600px] mx-auto w-full">
            <div className="grid grid-cols-12 gap-6 items-end">
              {/* Left: Wordmark */}
              <div className="col-span-12 lg:col-span-8">
                <div className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-6 flex items-center gap-3" style={mono}>
                  <span className="w-8 h-px bg-white/40" />
                  Sovereign Communications
                </div>
                <h1
                  className="font-light leading-[0.82] tracking-[-0.06em] text-white"
                  style={{
                    ...geist,
                    fontSize: 'clamp(5rem, 18vw, 22rem)',
                    fontWeight: 200,
                  }}
                >
                  ARVOR
                </h1>
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-3xl md:text-5xl font-light italic text-white/80" style={serif}>
                    /ahr-vor/
                  </span>
                  <span className="text-xs tracking-[0.3em] uppercase text-white/40" style={mono}>
                    n. — refuge
                  </span>
                </div>
              </div>

              {/* Right: Statement */}
              <div className="col-span-12 lg:col-span-4 lg:pl-8 lg:border-l lg:border-white/10">
                <p className="text-xl md:text-2xl font-light leading-[1.3] text-white/90 mb-8" style={serif}>
                  A communication layer for those whose words could{' '}
                  <span className="italic">change history</span> — or end it.
                </p>
                <p className="text-sm leading-relaxed text-white/50 mb-10" style={geist}>
                  Built post-quantum. Engineered for plausible deniability. Trusted by sources, statesmen, and the silent ones in between.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="group inline-flex items-center justify-between w-full px-6 py-4 rounded-full bg-white text-black hover:bg-white/90 transition-all"
                  >
                    <span className="text-sm font-medium tracking-wide">Request Access</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:rotate-45" />
                  </button>
                  <button
                    onClick={() => document.getElementById('manifesto')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group inline-flex items-center justify-between w-full px-6 py-4 rounded-full border border-white/15 text-white hover:bg-white/5 transition-all"
                  >
                    <span className="text-sm font-medium tracking-wide">Read the Doctrine</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:rotate-45" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom marquee */}
        <div className="border-t border-white/10 backdrop-blur-md bg-black/20">
          <div className="px-8 md:px-16 py-4 flex justify-between items-center text-[10px] tracking-[0.3em] uppercase text-white/40" style={mono}>
            <div className="flex gap-8">
              <span>◇ Zero-Knowledge</span>
              <span className="hidden md:inline">◇ Post-Quantum</span>
              <span className="hidden md:inline">◇ Self-Custody</span>
            </div>
            <span className="hidden md:inline">Scroll ↓</span>
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section id="manifesto" className="relative z-10 py-40 px-8 md:px-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-3">
              <p className="text-[10px] tracking-[0.4em] uppercase text-white/40" style={mono}>
                01 — Doctrine
              </p>
            </div>
            <div className="col-span-12 md:col-span-9">
              <h2
                className="font-light leading-[1.05] tracking-[-0.03em] text-white/95"
                style={{ ...serif, fontSize: 'clamp(2.5rem, 6vw, 6rem)' }}
              >
                Privacy is not a setting. It is the <em className="text-white/60">architecture</em>, the <em className="text-white/60">posture</em>, the <em className="text-white/60">vow</em>.
              </h2>
              <p className="mt-10 max-w-2xl text-white/50 text-base leading-relaxed" style={geist}>
                We do not store metadata. We do not retain keys. We do not own your identity. ARVOR exists in the gap between you and the network — and nowhere else.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITIES — bento-asymmetric */}
      <section className="relative z-10 py-40 px-8 md:px-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-end justify-between mb-16 flex-wrap gap-4">
            <div>
              <p className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-3" style={mono}>
                02 — Capabilities
              </p>
              <h2 className="text-4xl md:text-6xl font-light tracking-[-0.03em]" style={serif}>
                Six axioms. <em className="text-white/50">Zero compromise.</em>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3">
            {[
              { n: '01', t: 'Zero-Knowledge Mesh', d: 'No server ever holds a readable byte. Every relay is mathematically blind.', span: 'md:col-span-6 md:row-span-2', large: true },
              { n: '02', t: 'Post-Quantum', d: 'Kyber-1024 + X25519 hybrid. Future-proof against harvest-now-decrypt-later.', span: 'md:col-span-3' },
              { n: '03', t: 'Burn Protocol', d: 'Forward secrecy with ephemeral re-keying every 60 seconds.', span: 'md:col-span-3' },
              { n: '04', t: 'Capture-Resistant', d: 'Screenshot detection, screen-share blocking, anti-forensic scrubbing.', span: 'md:col-span-4' },
              { n: '05', t: 'Biometric Custody', d: 'Multi-factor identity binding without storing biometric templates.', span: 'md:col-span-4' },
              { n: '06', t: 'Sovereign Routing', d: 'Decentralized node mesh. No single jurisdiction. No kill switch.', span: 'md:col-span-4' },
            ].map((c) => (
              <article
                key={c.n}
                className={`${c.span} col-span-12 group relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent backdrop-blur-sm p-8 md:p-10 overflow-hidden hover:border-white/30 transition-all duration-500`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_var(--x,50%)_var(--y,50%),rgba(255,255,255,0.06),transparent_60%)]" />
                <div className="relative flex flex-col h-full justify-between min-h-[200px]">
                  <span className="text-[10px] tracking-[0.4em] text-white/40" style={mono}>
                    {c.n}
                  </span>
                  <div>
                    <h3
                      className={`${c.large ? 'text-4xl md:text-6xl' : 'text-2xl md:text-3xl'} font-light tracking-[-0.02em] mb-4 text-white`}
                      style={serif}
                    >
                      {c.t}
                    </h3>
                    <p className={`${c.large ? 'text-base max-w-md' : 'text-sm'} text-white/50 leading-relaxed`} style={geist}>
                      {c.d}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TRUSTED */}
      <section className="relative z-10 py-32 px-8 md:px-16 border-y border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-12 text-center" style={mono}>
            03 — In service of officials across
          </p>
          <div className="flex items-center justify-center gap-10 md:gap-16 flex-wrap">
            {['us', 'in', 'pe', 'gb', 'au', 'ca', 'mx'].map((c) => (
              <img
                key={c}
                src={`https://flagcdn.com/w320/${c}.png`}
                alt={`${c.toUpperCase()} flag`}
                className="h-7 md:h-9 w-auto rounded-sm grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all duration-500"
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-40 px-8 md:px-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-12 gap-6 items-end">
            <div className="col-span-12 md:col-span-8">
              <p className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-6" style={mono}>
                04 — Enlist
              </p>
              <h2
                className="font-light leading-[0.9] tracking-[-0.04em]"
                style={{ ...serif, fontSize: 'clamp(3rem, 9vw, 9rem)' }}
              >
                Become <em>unreadable.</em>
              </h2>
            </div>
            <div className="col-span-12 md:col-span-4 md:text-right">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="group inline-flex items-center gap-4 px-8 py-5 rounded-full bg-white text-black text-sm font-medium tracking-wide hover:bg-white/90 transition-all"
              >
                Open the Vault
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:rotate-45" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/10 backdrop-blur-md bg-black/40">
        <div className="max-w-[1400px] mx-auto px-8 md:px-16 py-16">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-6">
              <div className="text-3xl tracking-[0.2em] font-light" style={geist}>
                ARVOR
              </div>
              <p className="mt-4 text-sm text-white/40 max-w-sm" style={geist}>
                Engineered in silence. Operated in shadow. Trusted in consequence.
              </p>
            </div>
            <div className="col-span-6 md:col-span-3">
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-4" style={mono}>System</p>
              <ul className="space-y-2 text-sm text-white/70" style={geist}>
                <li><a href="#manifesto" className="hover:text-white transition-colors">Doctrine</a></li>
                <li><button onClick={() => setIsAuthModalOpen(true)} className="hover:text-white transition-colors">Access</button></li>
                <li><a href="/features" className="hover:text-white transition-colors">Capabilities</a></li>
              </ul>
            </div>
            <div className="col-span-6 md:col-span-3">
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-4" style={mono}>Status</p>
              <ul className="space-y-2 text-sm text-white/70" style={geist}>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> All systems nominal</li>
                <li style={mono} className="text-xs text-white/40">{time || '--:--:--'}</li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-white/5 flex justify-between items-center text-[10px] tracking-[0.3em] uppercase text-white/30" style={mono}>
            <span>© 2027 ARVOR · All rights reserved</span>
            <span>v27.04 — Encrypted Build</span>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Index;

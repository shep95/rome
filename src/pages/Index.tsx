import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthModal } from "@/components/ui/auth-modal";
import { GlassmorphismHeader } from "@/components/ui/glassmorphism-header";
import { GlassmorphismFooter } from "@/components/ui/glassmorphism-footer";
import { useAuth } from '@/hooks/useAuth';
import { ArrowRight, Shield, Lock, Eye, Zap, Globe, Fingerprint } from 'lucide-react';
import landingBg from '@/assets/landing-bg.jpg';

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) navigate('/dashboard');
  }, [user, loading, navigate]);

  const handleAuthSuccess = () => navigate('/dashboard');

  const features = [
    { icon: Shield, title: 'Zero-Knowledge', desc: 'End-to-end encrypted. Not even we can read it.' },
    { icon: Lock, title: 'Quantum-Hardened', desc: 'Post-quantum cryptography built in by default.' },
    { icon: Eye, title: 'Screenshot Proof', desc: 'Protected from prying eyes & forensic capture.' },
    { icon: Fingerprint, title: 'Biometric Lock', desc: 'Multi-factor identity at every entry point.' },
    { icon: Zap, title: 'Self-Destruct', desc: 'Burn-on-read messages with full deniability.' },
    { icon: Globe, title: 'Sovereign Mesh', desc: 'Decentralized routing across trusted nodes.' },
  ];

  return (
    <div className="relative min-h-screen w-full bg-black text-foreground overflow-x-hidden">
      {/* Fixed cinematic background wallpaper */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${landingBg})` }}
        aria-hidden="true"
      />
      {/* Gradient overlays for depth */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/40 via-black/30 to-black/90 pointer-events-none" aria-hidden="true" />
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none" aria-hidden="true" />

      <GlassmorphismHeader onSignUpClick={() => setIsAuthModalOpen(true)} />

      {/* HERO */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl text-xs tracking-[0.3em] uppercase text-white/70">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Classified Communications
          </div>

          <h1 className="text-7xl sm:text-8xl md:text-[10rem] lg:text-[13rem] font-black tracking-[-0.05em] leading-none mb-6 bg-gradient-to-b from-white via-white/90 to-white/40 bg-clip-text text-transparent drop-shadow-[0_0_60px_rgba(255,200,120,0.15)]">
            ROME
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl font-light text-white/70 max-w-2xl mx-auto mb-12 tracking-wide">
            The last secure messaging app you'll ever need.
            <br className="hidden sm:block" />
            Built for those who cannot afford to be heard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="group relative px-8 py-4 rounded-full bg-white text-black font-semibold tracking-wide overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]"
            >
              <span className="relative z-10 flex items-center gap-2">
                Enter the Vault
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-xl text-white font-medium tracking-wide hover:bg-white/10 transition-all"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Floating scroll cue */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 text-xs tracking-[0.3em] uppercase">
          <span>Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
        </div>
      </section>

      {/* TRUSTED BY */}
      <section className="relative z-10 py-20 border-y border-white/10 backdrop-blur-sm bg-black/20">
        <div className="container mx-auto px-6 text-center">
          <p className="text-xs tracking-[0.4em] uppercase text-white/40 mb-8">Trusted By Officials Across</p>
          <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
            {['us', 'in', 'pe', 'gb', 'au', 'ca', 'mx'].map((c) => (
              <img
                key={c}
                src={`https://flagcdn.com/w320/${c}.png`}
                alt={`${c} flag`}
                className="h-8 md:h-10 w-auto rounded-sm grayscale opacity-50 hover:opacity-100 hover:grayscale-0 hover:scale-110 transition-all duration-500"
              />
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs tracking-[0.4em] uppercase text-amber-300/70 mb-4">Capabilities</p>
            <h2 className="text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
              Engineered for silence.
            </h2>
            <p className="text-white/50 mt-6 max-w-2xl mx-auto text-lg">
              Every byte fortified. Every connection vetted. Every conversation, yours alone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group relative p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl overflow-hidden hover:border-amber-300/30 transition-all duration-500 hover:-translate-y-1"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-transparent to-amber-500/0 group-hover:from-amber-500/10 group-hover:to-amber-500/5 transition-all duration-500" />
                <div className="relative">
                  <div className="w-12 h-12 mb-6 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-amber-300/10 group-hover:border-amber-300/30 transition-all">
                    <f.icon className="w-5 h-5 text-white/80 group-hover:text-amber-200" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">{f.title}</h3>
                  <p className="text-white/50 leading-relaxed text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs tracking-[0.4em] uppercase text-amber-300/70 mb-6">Manifesto</p>
          <blockquote className="text-3xl md:text-5xl font-light text-white/90 leading-[1.2] tracking-tight">
            "Privacy isn't a feature.
            <br />
            <span className="bg-gradient-to-r from-amber-200 via-white to-amber-200 bg-clip-text text-transparent font-medium">
              It's the architecture."
            </span>
          </blockquote>
          <p className="text-white/40 mt-8 text-sm tracking-wide">— The ROME Doctrine</p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-2xl p-12 md:p-20 text-center">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-400/10 rounded-full blur-[120px]" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px]" />
            <div className="relative">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
                Step inside the fortress.
              </h2>
              <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
                Join the operatives, dissidents, and decision-makers who chose to be unreadable.
              </p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="group inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white text-black font-semibold tracking-wide hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all"
              >
                Create Encrypted Identity
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 py-20">
        <GlassmorphismFooter />
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

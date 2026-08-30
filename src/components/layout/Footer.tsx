import React, { useState } from 'react';
import { ShieldCheck, Truck, Sparkles, Mail, Phone, Lock, CheckCheck, Send, DollarSign } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
        setSubscribed(false);
      }, 3500);
    }
  };

  return (
    <footer className="mt-10 border-t border-[#eedbe6] bg-gradient-to-b from-[#fffafc] via-white to-[#fff5f8] text-[#141219]">
      
      {/* 1. VIP Reveal Club & Newsletter Sign-Up Banner */}
      <div className="border-b border-[#f0e2ec] bg-gradient-to-r from-[#fff0f5] via-[#fff7fa] to-[#fbf5ff] py-6 sm:py-8 px-3 sm:px-6">
        <div className="max-w-[1460px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
          
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ec2f73]/10 text-[#ec2f73] text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-2 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>VIP Reveal Club</span>
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-[26px] font-black text-[#141219] tracking-tight leading-snug hero-title-font m-0 mb-1.5">
              Unlock 15% Off Your Next Surprise &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ec2f73] to-[#d92467]">
                Weekly Cash Drop Alerts
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-[#55505a] leading-relaxed m-0 font-medium">
              Join over <strong className="text-[#141219] font-bold">85,000+ unboxing fans</strong>. Be first to know about new limited scents, rare diamond jewelry drops, and grand cash reveals.
            </p>
          </div>

          <div className="lg:col-span-6">
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-lg lg:ml-auto">
              <div className="relative flex-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  className="w-full h-[46px] sm:h-[48px] pl-10 pr-4 rounded-[14px] bg-white border border-[#e8dfe5] focus:border-[#ec2f73] focus:ring-2 focus:ring-[#ec2f73]/10 text-xs sm:text-sm text-[#141219] outline-none shadow-2xs transition-all"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a858f]" />
              </div>

              <button
                type="submit"
                disabled={subscribed}
                className="h-[46px] sm:h-[48px] px-6 rounded-[14px] bg-[#ec2f73] hover:bg-[#d92467] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_6px_20px_rgba(236,47,115,0.28)] hover:shadow-[0_10px_24px_rgba(236,47,115,0.38)] active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                {subscribed ? (
                  <>
                    <CheckCheck className="w-4 h-4 stroke-[3]" />
                    <span>Subscribed! ✓</span>
                  </>
                ) : (
                  <>
                    <span>Claim 15% Off</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
            <div className="flex items-center gap-3 text-[10px] text-[#716d77] mt-2 max-w-lg lg:ml-auto font-medium">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Zero spam. Unsubscribe anytime.</span>
              </span>
              <span>•</span>
              <span>Instant 15% code sent to inbox</span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Top 3 Quick-Trust Highlights */}
      <div className="border-b border-[#f2edf1] py-4 bg-white/80">
        <div className="max-w-[1460px] mx-auto px-3 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-left">
          
          <div className="flex items-center justify-start text-left gap-3 px-3.5 py-2.5 sm:p-2.5 rounded-[14px] bg-[#fff8fb] border border-[#f5e4ec] shadow-2xs">
            <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white border border-[#f2d8e2] text-[#ec2f73] flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <strong className="block text-xs font-black text-[#141219] leading-snug">Guaranteed Surprise Inside</strong>
              <span className="block text-[11px] sm:text-[10px] text-[#716d77] leading-tight mt-0.5">Real cash or luxury jewelry in 100% of orders</span>
            </div>
          </div>

          <div className="flex items-center justify-start text-left gap-3 px-3.5 py-2.5 sm:p-2.5 rounded-[14px] bg-[#fff8fb] border border-[#f5e4ec] shadow-2xs">
            <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white border border-[#f2d8e2] text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Truck className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <strong className="block text-xs font-black text-[#141219] leading-snug">Express 2-3 Day Dispatch</strong>
              <span className="block text-[11px] sm:text-[10px] text-[#716d77] leading-tight mt-0.5">Free tracked shipping nationwide on $50+</span>
            </div>
          </div>

          <div className="flex items-center justify-start text-left gap-3 px-3.5 py-2.5 sm:p-2.5 rounded-[14px] bg-[#fff8fb] border border-[#f5e4ec] shadow-2xs">
            <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white border border-[#f2d8e2] text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <strong className="block text-xs font-black text-[#141219] leading-snug">100% Hand-Poured Soy Wax</strong>
              <span className="block text-[11px] sm:text-[10px] text-[#716d77] leading-tight mt-0.5">Clean-burning, vegan & lead-free wicks</span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Main Footer Links & Social Media Hub */}
      <div id="about" className="max-w-[1460px] mx-auto px-3 sm:px-6 py-8 sm:py-12">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Brand Info, Description & Social Media Links (Spans 4 columns on large screens) */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div>
              <a href="#hero" className="inline-block mb-3.5 group focus:outline-none">
                <img
                  src="/assets/ilovesurprises/logo/i love surprises logo.jpeg"
                  alt="I Love Surprises Logo"
                  className="h-10 sm:h-16 md:h-20 w-auto max-w-[140px] sm:max-w-[180px] md:max-w-[200px] object-contain transition-transform duration-300 group-hover:scale-103"
                  loading="lazy"
                />
              </a>

              <p className="text-xs text-[#55505a] leading-relaxed max-w-sm m-0 mb-4 font-medium">
                The world's favorite unboxing & surprise experience. Hand-poured aromatic soy candles, bath treats & body treats with authentic cash (<strong className="text-[#141219] font-black">$2 to $2,500</strong>) or fine jewelry (<strong className="text-[#141219] font-black">up to $7,500</strong>) waiting inside.
              </p>

              {/* Social Media Links with Elevated Hover States */}
              <div className="mb-5">
                <span className="block text-[10px] font-black uppercase tracking-wider text-[#8a858f] mb-2.5">
                  Follow Our Viral Unboxings
                </span>
                
                <div className="flex items-center gap-2">
                  
                  {/* Instagram */}
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="w-9 h-9 rounded-[12px] bg-white border border-[#eedbe6] text-[#55505a] hover:text-white hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:border-transparent hover:shadow-[0_6px_16px_rgba(220,39,67,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center shadow-2xs group"
                  >
                    <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>

                  {/* TikTok */}
                  <a
                    href="https://tiktok.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="TikTok"
                    className="w-9 h-9 rounded-[12px] bg-white border border-[#eedbe6] text-[#55505a] hover:text-white hover:bg-[#000000] hover:border-[#000000] hover:shadow-[0_6px_16px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center shadow-2xs group"
                  >
                    <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.46V12.9a8.16 8.16 0 0 0 5.73 2.29V11.74a4.84 4.84 0 0 1-2.14-.54 4.79 4.79 0 0 1-1.86-1.78v-2.73z"/>
                    </svg>
                  </a>

                  {/* Facebook */}
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook"
                    className="w-9 h-9 rounded-[12px] bg-white border border-[#eedbe6] text-[#55505a] hover:text-white hover:bg-[#1877f2] hover:border-[#1877f2] hover:shadow-[0_6px_16px_rgba(24,119,242,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center shadow-2xs group"
                  >
                    <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>

                  {/* YouTube */}
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="YouTube"
                    className="w-9 h-9 rounded-[12px] bg-white border border-[#eedbe6] text-[#55505a] hover:text-white hover:bg-[#ff0000] hover:border-[#ff0000] hover:shadow-[0_6px_16px_rgba(255,0,0,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center shadow-2xs group"
                  >
                    <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>

                  {/* Pinterest */}
                  <a
                    href="https://pinterest.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Pinterest"
                    className="w-9 h-9 rounded-[12px] bg-white border border-[#eedbe6] text-[#55505a] hover:text-white hover:bg-[#e60023] hover:border-[#e60023] hover:shadow-[0_6px_16px_rgba(230,0,35,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center shadow-2xs group"
                  >
                    <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path d="M12 0a12 12 0 0 0-4.37 23.18c-.07-.98-.13-2.48.03-3.55.14-.97.94-6.42.94-6.42s-.24-.48-.24-1.2c0-1.12.65-1.96 1.46-1.96.69 0 1.02.52 1.02 1.14 0 .69-.44 1.73-.67 2.69-.19.8.4 1.46 1.19 1.46 1.43 0 2.53-1.51 2.53-3.68 0-1.93-1.38-3.27-3.36-3.27-2.46 0-3.9 1.84-3.9 3.75 0 .74.29 1.54.64 1.97.07.09.08.16.06.25-.07.28-.22.9-.25 1.03-.04.17-.14.21-.32.13-1.18-.55-1.92-2.28-1.92-3.66 0-2.98 2.17-5.72 6.25-5.72 3.28 0 5.83 2.34 5.83 5.47 0 3.26-2.06 5.89-4.91 5.89-.96 0-1.86-.5-2.17-1.09l-.59 2.25c-.21.82-.79 1.84-1.17 2.47A12 12 0 1 0 12 0z"/>
                    </svg>
                  </a>

                  {/* X / Twitter */}
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="X (Twitter)"
                    className="w-9 h-9 rounded-[12px] bg-white border border-[#eedbe6] text-[#55505a] hover:text-white hover:bg-[#141219] hover:border-[#141219] hover:shadow-[0_6px_16px_rgba(20,18,25,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center shadow-2xs group"
                  >
                    <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>

                </div>
              </div>
            </div>

            {/* Direct Support Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-bold text-[#55505a]">
              <a
                href="mailto:support@ilovesurprises.com"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#eedbe6] hover:border-[#ec2f73] hover:text-[#ec2f73] transition-colors shadow-2xs"
              >
                <Mail className="w-3.5 h-3.5 text-[#ec2f73]" />
                <span>support@ilovesurprises.com</span>
              </a>

              <a
                href="tel:18007877747"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#eedbe6] hover:border-[#ec2f73] hover:text-[#ec2f73] transition-colors shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>1-800-SURPRISE</span>
              </a>
            </div>
          </div>

          {/* Column 1: Shop Collections (Spans 2 columns) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#141219] m-0 mb-3.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ec2f73]" />
              <span>Collections</span>
            </h4>
            <ul className="list-none p-0 m-0 space-y-2 text-xs text-[#5e5963] font-medium">
              <li>
                <a href="#featured" className="hover:text-[#ec2f73] hover:translate-x-1 inline-block transition-all py-0.5">
                  💵 Real Cash Candles
                </a>
              </li>
              <li>
                <a href="#featured" className="hover:text-[#ec2f73] hover:translate-x-1 inline-block transition-all py-0.5">
                  💍 Fine Jewelry Candles
                </a>
              </li>
              <li>
                <a href="#featured" className="hover:text-[#ec2f73] hover:translate-x-1 inline-block transition-all py-0.5">
                  🛁 Cash Bath Treats
                </a>
              </li>
              <li>
                <a href="#featured" className="hover:text-[#ec2f73] hover:translate-x-1 inline-block transition-all py-0.5">
                  🔥 Scented Wax Melts
                </a>
              </li>
              <li>
                <a href="#featured" className="hover:text-[#ec2f73] hover:translate-x-1 inline-block transition-all py-0.5">
                  🧼 Goat Milk Soaps
                </a>
              </li>
              <li>
                <a href="#featured" className="hover:text-[#ec2f73] hover:translate-x-1 inline-block transition-all py-0.5">
                  🎂 Birthday Slimes
                </a>
              </li>
              <li>
                <a href="#featured" className="hover:text-[#ec2f73] hover:translate-x-1 inline-block transition-all py-0.5">
                  ⭐ Zodiac Horoscope Jars
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Customer Care & Guarantees (Spans 3 columns) */}
          <div id="contact" className="lg:col-span-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#141219] m-0 mb-3.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Customer Care</span>
            </h4>
            <ul className="list-none p-0 m-0 space-y-2 text-xs text-[#5e5963] font-medium">
              <li>
                <a href="#experience" className="hover:text-[#ec2f73] hover:translate-x-1 inline-block transition-all py-0.5">
                  📦 Track Your Delivery
                </a>
              </li>
              <li>
                <a href="#experience" className="hover:text-[#ec2f73] hover:translate-x-1 inline-block transition-all py-0.5">
                  🚚 Free Shipping Over $50
                </a>
              </li>
              <li>
                <a href="#experience" className="hover:text-[#ec2f73] hover:translate-x-1 inline-block transition-all py-0.5">
                  🛡️ 100% Win Guarantee Policy
                </a>
              </li>
              <li>
                <a href="#experience" className="hover:text-[#ec2f73] hover:translate-x-1 inline-block transition-all py-0.5">
                  💎 Jewelry Appraisal Verification
                </a>
              </li>
              <li>
                <a href="#experience" className="hover:text-[#ec2f73] hover:translate-x-1 inline-block transition-all py-0.5">
                  🕯️ Soy Candle Care & Burn Tips
                </a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-[#ec2f73] hover:translate-x-1 inline-block transition-all py-0.5">
                  ★ Verified Unboxing Reviews
                </a>
              </li>
              <li>
                <a href="#experience" className="hover:text-[#ec2f73] hover:translate-x-1 inline-block transition-all py-0.5">
                  💬 24/7 Live Customer Help
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Representative & Earning (Spans 3 columns) */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#141219] m-0 mb-3.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#ec2f73]" />
              <span>Partner & Earn</span>
            </h4>
            <ul className="list-none p-0 m-0 space-y-2 text-xs text-[#5e5963] font-medium">
              <li>
                <a href="#affiliate" className="text-[#ec2f73] font-black hover:underline hover:translate-x-1 inline-block transition-all py-0.5">
                  ✨ Join Representative Program (20%)
                </a>
              </li>
              <li>
                <a href="#affiliate" className="hover:text-[#ec2f73] hover:translate-x-1 inline-block transition-all py-0.5">
                  📈 5-Tier Team Bonus Plan
                </a>
              </li>
              <li>
                <a href="#affiliate" className="hover:text-[#ec2f73] hover:translate-x-1 inline-block transition-all py-0.5">
                  💼 Rep Portal Dashboard
                </a>
              </li>
              <li>
                <a href="#affiliate" className="hover:text-[#ec2f73] hover:translate-x-1 inline-block transition-all py-0.5">
                  💳 Weekly Direct PayPal / Bank Payouts
                </a>
              </li>
              <li>
                <a href="#affiliate" className="hover:text-[#ec2f73] hover:translate-x-1 inline-block transition-all py-0.5">
                  🎁 Fundraiser & Bulk School Orders
                </a>
              </li>
              <li>
                <a href="#affiliate" className="hover:text-[#ec2f73] hover:translate-x-1 inline-block transition-all py-0.5">
                  🏪 Wholesale & Boutique Inquiries
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* 4. Payment Badges & Safe Checkout Strip */}
        <div className="mt-10 pt-6 border-t border-[#f0e4ec] flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 text-xs font-bold text-[#141219]">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>256-Bit SSL Encrypted Bank-Grade Checkout</span>
          </div>

          {/* Payment Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold text-[#55505a]">
            <span className="px-2.5 py-1 rounded-[8px] bg-white border border-[#e8dfe5] shadow-2xs font-mono font-bold">
              VISA
            </span>
            <span className="px-2.5 py-1 rounded-[8px] bg-white border border-[#e8dfe5] shadow-2xs font-mono font-bold">
              Mastercard
            </span>
            <span className="px-2.5 py-1 rounded-[8px] bg-white border border-[#e8dfe5] shadow-2xs font-mono font-bold">
              AMEX
            </span>
            <span className="px-2.5 py-1 rounded-[8px] bg-white border border-[#e8dfe5] shadow-2xs font-mono font-bold text-[#003087]">
              PayPal
            </span>
            <span className="px-2.5 py-1 rounded-[8px] bg-white border border-[#e8dfe5] shadow-2xs font-mono font-bold">
              Apple Pay
            </span>
            <span className="px-2.5 py-1 rounded-[8px] bg-white border border-[#e8dfe5] shadow-2xs font-mono font-bold text-[#5a31f4]">
              Shop Pay
            </span>
            <span className="px-2.5 py-1 rounded-[8px] bg-white border border-[#e8dfe5] shadow-2xs font-mono font-bold">
              Google Pay
            </span>
          </div>

        </div>

        {/* 5. Bottom Copyright Strip */}
        <div className="mt-6 pt-4 border-t border-[#f4edf2] text-[11px] text-[#85818a] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <p className="m-0">
            © 2026 <strong className="text-[#141219]">ILoveSurprises.com</strong>. All rights reserved. Hand-poured with love in the USA.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="#hero" className="hover:text-[#ec2f73] transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#hero" className="hover:text-[#ec2f73] transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="#hero" className="hover:text-[#ec2f73] transition-colors">CA Supply Chains Act</a>
            <span>•</span>
            <span className="text-[#ec2f73] font-bold">FlowFoundry AI Solutions</span>
          </div>
        </div>

      </div>
    </footer>
  );
};


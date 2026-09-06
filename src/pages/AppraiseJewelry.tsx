import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Award,
  Lock,
  ChevronDown,
  ShoppingBag,
  Flame,
  ShieldCheck,
  Tag,
  Copy,
  Check,
} from 'lucide-react';
import type { PublicAppraisalResult } from '../types/appraisal';
import { appraisalService } from '../services/appraisalService';

interface AppraiseJewelryProps {
  onNavigateToShop?: () => void;
}

const SAMPLE_CODES = [
  { code: 'ILS-GOLD-550', label: '$550 Gold Earrings' },
  { code: 'ILS-SILVER-250', label: '$250 Silver Ring' },
  { code: 'ILS-DIAMOND-7500', label: '$7,500 Diamond Ring' },
  { code: 'ILS-SAPPHIRE-2500', label: '$2,500 Sapphire' },
];

const FAQS = [
  {
    q: 'Where do I find my jewelry code?',
    a: 'Every piece of fine jewelry revealed inside our surprise candles, wax melts, or bath treats is sealed inside a heat-resistant protective pouch. Attached directly to the jewelry or packaging is an official appraisal tag printed with your unique authentication code (e.g., ILS-GOLD-550).',
  },
  {
    q: 'How is the jewelry value estimated?',
    a: 'Our jewelry values represent certified manufacturer suggested retail values (MSRP) verified by professional independent gemologists and appraisers. Valuations are based on current precious metal purity (.925 solid sterling silver, 14K solid gold), gemstone carat weight, color, clarity, and craftsmanship.',
  },
  {
    q: 'Can I have my revealed jewelry appraised by my local jeweler?',
    a: 'Yes! We encourage it. 100% of our fine jewelry is crafted from solid precious metals stamped with authentic hallmarks (.925 or 14K) and genuine stones. Any certified jeweler or pawn appraiser will verify its authentic precious metal content.',
  },
  {
    q: 'What if my jewelry code comes back as not found?',
    a: 'Please double-check the characters printed on your tag. Codes are usually formatted as ILS-XXXX-XXXX. Ensure there are no typos, or contact our 24/7 customer care team with a photo of your appraisal tag and we will verify it immediately.',
  },
];

export const AppraiseJewelry: React.FC<AppraiseJewelryProps> = ({ onNavigateToShop }) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appraisalResult, setAppraisalResult] = useState<PublicAppraisalResult | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleLookup = async (codeToLookup?: string) => {
    const targetCode = (codeToLookup !== undefined ? codeToLookup : code).trim();

    if (!targetCode) {
      setError('Please enter your jewelry code to discover its appraised value.');
      setAppraisalResult(null);
      inputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await appraisalService.lookupJewelryCode(targetCode);

      if (res.success && res.data) {
        setAppraisalResult(res.data);
        setError(null);
        // Smooth scroll to result card on mobile
        setTimeout(() => {
          resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      } else {
        setAppraisalResult(null);
        setError(res.error || "We couldn't find that jewelry code. Please check the code and try again.");
      }
    } catch {
      setAppraisalResult(null);
      setError("We couldn't find that jewelry code. Please check the code and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup();
  };

  const handleReset = () => {
    setCode('');
    setAppraisalResult(null);
    setError(null);
    inputRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyCode = () => {
    if (appraisalResult?.code) {
      navigator.clipboard.writeText(appraisalResult.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffafc] via-white to-[#fff8fa] text-[#141219] py-6 sm:py-10 px-3.5 sm:px-6 lg:px-8">
      <div className="max-w-[1180px] mx-auto space-y-8 sm:space-y-12">
        {/* ================================================================
            1. HERO SECTION & VALUE PROMISE
        ================================================================ */}
        <section className="text-center max-w-3xl mx-auto pt-2 sm:pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D30915]/10 border border-[#D30915]/20 text-[#D30915] text-xs font-black uppercase tracking-wider mb-4 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Official Surprise Reveal Appraisal</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#141219] tracking-tight leading-[1.1] hero-title-font mb-4">
            Appraise Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D30915] via-[#E11D48] to-[#B60711]">
              Jewelry
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-[#55505a] leading-relaxed max-w-2xl mx-auto font-medium mb-6">
            Found a piece of jewelry in your candle?
            <br className="hidden sm:inline" /> Enter your jewelry code to discover what it's worth.
          </p>

          {/* Quick Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-[11px] sm:text-xs font-bold text-[#55505a]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#eedbe6] shadow-2xs">
              <Award className="w-3.5 h-3.5 text-[#D30915]" />
              <span>Certified .925 Silver & 14K Gold</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#eedbe6] shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Appraised $10 up to $7,500</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#eedbe6] shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-purple-600" />
              <span>100% Genuine Guaranteed</span>
            </span>
          </div>
        </section>

        {/* ================================================================
            2. INTERACTIVE CODE LOOKUP FORM
        ================================================================ */}
        <section className="max-w-2xl mx-auto">
          <div className="relative rounded-[24px] sm:rounded-[28px] bg-white border-2 border-[#f0e0ea] shadow-[0_16px_50px_rgba(211,9,21,0.08)] p-5 sm:p-8 transition-all">
            {/* Ambient Background Glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#D30915]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

            <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-5 relative">
              <div>
                <label
                  htmlFor="jewelry-code-input"
                  className="block text-xs sm:text-sm font-black text-[#141219] uppercase tracking-wider mb-2 flex items-center justify-between"
                >
                  <span>Jewelry Code</span>
                  <span className="text-[11px] text-[#8a858f] font-normal normal-case">
                    Printed on your certification tag
                  </span>
                </label>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a858f] pointer-events-none">
                    <Tag className="w-5 h-5 text-[#D30915]" />
                  </div>

                  <input
                    ref={inputRef}
                    id="jewelry-code-input"
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      if (error) setError(null);
                    }}
                    placeholder="Enter your jewelry code (e.g. ILS-GOLD-550)"
                    disabled={isLoading}
                    className="w-full h-[52px] sm:h-[58px] pl-12 pr-12 rounded-[16px] sm:rounded-[18px] bg-[#fffafc] border-2 border-[#e8dfe5] focus:border-[#D30915] focus:bg-white focus:ring-4 focus:ring-[#D30915]/10 text-sm sm:text-base font-black text-[#141219] tracking-wider placeholder:font-normal placeholder:tracking-normal placeholder:text-[#9c96a0] outline-none transition-all shadow-inner"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
                    spellCheck="false"
                  />

                  {code && !isLoading && (
                    <button
                      type="button"
                      onClick={() => {
                        setCode('');
                        setError(null);
                        inputRef.current?.focus();
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center text-xs transition-colors cursor-pointer"
                      aria-label="Clear jewelry code"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[52px] sm:h-[58px] rounded-[16px] sm:rounded-[18px] bg-gradient-to-r from-[#D30915] via-[#E11D48] to-[#B60711] hover:from-[#B60711] hover:to-[#96060E] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_8px_24px_rgba(211,9,21,0.3)] hover:shadow-[0_12px_28px_rgba(211,9,21,0.4)] active:scale-[0.985] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 relative overflow-hidden"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Verifying Code & Authenticating...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 stroke-[2.5]" />
                    <span>Check Value</span>
                    <Sparkles className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>

            {/* Error Message Card */}
            {error && (
              <div
                role="alert"
                className="mt-4 p-3.5 sm:p-4 rounded-[14px] bg-[#fff1f2] border border-[#fecdd3] text-[#D30915] flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs sm:text-sm font-semibold leading-relaxed">
                  <span>{error}</span>
                  <div className="mt-1 text-[11px] text-[#716d77] font-normal">
                    Tip: Codes are printed on the white tag attached to your candle's surprise jewelry pouch.
                  </div>
                </div>
              </div>
            )}

            {/* Quick Sample Code Testing Pills */}
            <div className="mt-5 pt-4 border-t border-[#f4edf2]">
              <div className="text-[11px] font-bold text-[#8a858f] uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Try Sample Codes:</span>
                <span className="normal-case font-normal text-[10px] text-[#716d77]">Click to auto-check</span>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {SAMPLE_CODES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setCode(item.code);
                      handleLookup(item.code);
                    }}
                    className="px-2.5 py-1 rounded-full bg-[#faf7f9] hover:bg-[#fff0f3] border border-[#eedbe6] hover:border-[#fecdd3] text-[#141219] hover:text-[#D30915] text-[11px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1.5"
                  >
                    <span className="font-mono text-[#D30915]">{item.code}</span>
                    <span className="text-[#8a858f]">({item.label})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            3. SURPRISE REVEAL RESULT EXPERIENCE
        ================================================================ */}
        {appraisalResult && (
          <section
            ref={resultCardRef}
            className="max-w-4xl mx-auto scroll-mt-24 animate-in fade-in zoom-in-95 duration-300 ease-out"
          >
            {/* Top Celebration Value Banner */}
            <div className="relative overflow-hidden rounded-t-[24px] sm:rounded-t-[32px] bg-gradient-to-r from-[#141219] via-[#2a1320] to-[#141219] text-white p-6 sm:p-8 text-center border-x-2 border-t-2 border-[#D30915]/40 shadow-2xl">
              {/* Confetti & Particle Sparks */}
              <div className="absolute top-2 left-4 text-xl sm:text-2xl animate-bounce duration-1000">✨</div>
              <div className="absolute top-4 right-6 text-xl sm:text-2xl animate-bounce duration-1000 delay-150">💎</div>
              <div className="absolute bottom-2 left-1/4 text-lg opacity-40">🎉</div>
              <div className="absolute bottom-3 right-1/4 text-lg opacity-40">⭐</div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D30915] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest mb-2 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Certified Surprise Reveal</span>
              </div>

              <div className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#f5c5d0] mb-1">
                Your Jewelry Is Worth
              </div>

              {/* Ultra Prominent Appraised Value */}
              <div className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#FFF3B0] to-[#E6B800] drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] my-1">
                ${appraisalResult.estimatedValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#e8d7e0] mt-2 font-medium">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Verified Authentic</span>
                </span>
                <span>•</span>
                <span>Serial #{appraisalResult.serialNumber}</span>
                <span>•</span>
                <span>Inspected {appraisalResult.inspectedDate}</span>
              </div>
            </div>

            {/* Bottom Two-Column Jewelry Details Card */}
            <div className="rounded-b-[24px] sm:rounded-b-[32px] bg-white border-x-2 border-b-2 border-[#eedbe6] shadow-[0_20px_60px_rgba(20,18,25,0.09)] p-5 sm:p-8 lg:p-10">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
                {/* Left Column: High-Res Studio Image */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div className="relative w-full max-w-[340px] aspect-square rounded-[20px] sm:rounded-[24px] overflow-hidden bg-gradient-to-tr from-[#faf5f8] to-[#ffffff] border border-[#eedfe8] shadow-md group">
                    <img
                      src={appraisalResult.image}
                      alt={appraisalResult.name}
                      width={600}
                      height={600}
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      loading="eager"
                    />

                    {/* Hallmark / Metal Badge Overlay */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Award className="w-3 h-3 text-[#FFD700]" />
                      <span>{appraisalResult.type}</span>
                    </div>

                    {/* Value Badge Bottom Right */}
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-[#D30915] text-white text-[11px] font-black tracking-wide shadow-md">
                      ${appraisalResult.estimatedValue.toLocaleString('en-US', { minimumFractionDigits: 0 })} Value
                    </div>
                  </div>

                  <div className="text-[11px] text-[#8a858f] text-center mt-2.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Exact photo of revealed design & certified tag</span>
                  </div>
                </div>

                {/* Right Column: Specifications & Description */}
                <div className="md:col-span-7 space-y-4 sm:space-y-5">
                  <div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fff0f3] text-[#D30915] text-[10px] font-black uppercase tracking-wider mb-2">
                      <span>Tag: {appraisalResult.code}</span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="ml-1 text-[#D30915] hover:text-[#96060E] cursor-pointer"
                        title="Copy code"
                      >
                        {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>

                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#141219] tracking-tight leading-snug">
                      {appraisalResult.name}
                    </h2>
                  </div>

                  <p className="text-xs sm:text-sm text-[#55505a] leading-relaxed font-medium">
                    {appraisalResult.description}
                  </p>

                  {/* Specification Table Grid */}
                  <div className="rounded-[16px] bg-[#fffafc] border border-[#f0e2ec] p-3.5 sm:p-4 divide-y divide-[#f4e6ee] text-xs">
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-[#8a858f] font-semibold">Jewelry Type</span>
                      <span className="font-bold text-[#141219]">{appraisalResult.type}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-[#8a858f] font-semibold">Precious Metal</span>
                      <span className="font-bold text-[#141219]">{appraisalResult.material}</span>
                    </div>

                    {appraisalResult.stone && (
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-[#8a858f] font-semibold">Stone / Gems</span>
                        <span className="font-bold text-[#141219] text-right max-w-[60%]">{appraisalResult.stone}</span>
                      </div>
                    )}

                    {appraisalResult.cutSetting && (
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-[#8a858f] font-semibold">Setting & Cut</span>
                        <span className="font-bold text-[#141219] text-right max-w-[60%]">{appraisalResult.cutSetting}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-[#8a858f] font-semibold">Appraisal Status</span>
                      <span className="font-black text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Certified Authentic</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="h-[46px] px-5 rounded-[14px] bg-white border-2 border-[#eedbe6] hover:border-[#D30915] text-[#141219] hover:text-[#D30915] text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs active:scale-95"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Appraise Another Piece</span>
                    </button>

                    <button
                      type="button"
                      onClick={onNavigateToShop}
                      className="h-[46px] px-6 rounded-[14px] bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Shop More Surprise Candles</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================
            4. HOW TO LOCATE YOUR CODE (3-STEP VISUAL GUIDE)
        ================================================================ */}
        <section className="pt-4 sm:pt-8 border-t border-[#f0e2ec]">
          <div className="text-center max-w-xl mx-auto mb-6 sm:mb-10">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#D30915] block mb-1">
              Candle Reveal Guide
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#141219]">
              How to Find Your Jewelry Code
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="rounded-[20px] bg-white border border-[#eedfe8] p-5 sm:p-6 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-[#fff0f3] text-[#D30915] border border-[#fecdd3] flex items-center justify-center mx-auto shadow-2xs font-black text-lg">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-[#141219]">1. Burn & Discover</h3>
              <p className="text-xs text-[#55505a] leading-relaxed font-medium">
                Burn your luxury soy candle until you spot the shiny protective foil pouch emerging from the wax.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-[20px] bg-white border border-[#eedfe8] p-5 sm:p-6 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-[#fff0f3] text-[#D30915] border border-[#fecdd3] flex items-center justify-center mx-auto shadow-2xs font-black text-lg">
                <span>2</span>
              </div>
              <h3 className="text-base font-black text-[#141219]">2. Safely Extract</h3>
              <p className="text-xs text-[#55505a] leading-relaxed font-medium">
                Safely extinguish the flame, use tweezers to extract the foil pouch, let it cool for 60 seconds, and unwrap.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-[20px] bg-white border border-[#eedfe8] p-5 sm:p-6 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-[#fff0f3] text-[#D30915] border border-[#fecdd3] flex items-center justify-center mx-auto shadow-2xs font-black text-lg">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-[#141219]">3. Enter Your Tag Code</h3>
              <p className="text-xs text-[#55505a] leading-relaxed font-medium">
                Locate the code printed on your jewelry certification tag, enter it above, and reveal its appraised value!
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================
            5. FAQ ACCORDION SECTION
        ================================================================ */}
        <section className="pt-4 sm:pt-6 border-t border-[#f0e2ec] max-w-3xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#D30915] block mb-1">
              Have Questions?
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#141219]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={faq.q}
                  className="rounded-[18px] bg-white border border-[#eedfe8] overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-bold text-sm sm:text-base text-[#141219] hover:text-[#D30915] transition-colors cursor-pointer select-none"
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-[#D30915] shrink-0" />
                      <span>{faq.q}</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#8a858f] transition-transform duration-200 shrink-0 ml-2 ${
                        isOpen ? 'rotate-180 text-[#D30915]' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#55505a] leading-relaxed border-t border-[#f8edf4] bg-[#fffcfd] font-medium">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================================
            6. BOTTOM CTA SHOPPING BANNER
        ================================================================ */}
        <section className="rounded-[24px] sm:rounded-[32px] bg-gradient-to-r from-[#fff1f4] via-[#fff7fa] to-[#fbf2f8] border border-[#f2d8e4] p-6 sm:p-10 text-center space-y-4 max-w-4xl mx-auto shadow-sm">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D30915]/10 text-[#D30915] text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready for your next reveal?</span>
          </div>
          <h3 className="text-xl sm:text-3xl font-black text-[#141219] tracking-tight">
            Discover What's Waiting in Your Next Candle
          </h3>
          <p className="text-xs sm:text-sm text-[#55505a] max-w-xl mx-auto font-medium">
            Over 85,000 unboxing reveals across America. 100% of our items contain guaranteed real cash ($2 – $2,500) or
            certified fine jewelry valued up to $7,500.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onNavigateToShop}
              className="h-[48px] sm:h-[52px] px-8 rounded-[16px] bg-[#D30915] hover:bg-[#B60711] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_8px_20px_rgba(211,9,21,0.28)] hover:shadow-[0_12px_24px_rgba(211,9,21,0.38)] active:scale-95 transition-all duration-200 cursor-pointer inline-flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Candle Collections</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

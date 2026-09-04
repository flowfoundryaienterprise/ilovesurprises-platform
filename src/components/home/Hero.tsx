import React from 'react';
import { Gem, Gift, Store, Users, ChevronRight, Star } from 'lucide-react';

interface HeroProps {
  onShopSurprises?: () => void;
  onBecomeConsultant?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onShopSurprises,
  onBecomeConsultant,
}) => {
  const handleShopClick = (e: React.MouseEvent) => {
    if (onShopSurprises) {
      e.preventDefault();
      onShopSurprises();
    } else {
      const el = document.getElementById('featured') || document.getElementById('categories');
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleConsultantClick = (e: React.MouseEvent) => {
    if (onBecomeConsultant) {
      e.preventDefault();
      onBecomeConsultant();
    } else {
      const el = document.getElementById('affiliate');
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const benefitItems = [
    {
      id: 'hidden-jewelry',
      title: 'Hidden Jewelry Reveals',
      subtitle: 'Real jewelry in every product',
      icon: Gem,
      targetId: 'categories',
    },
    {
      id: 'viral-unboxing',
      title: 'Viral Unboxing Fun',
      subtitle: 'Share, surprise, repeat',
      icon: Gift,
      targetId: 'featured',
    },
    {
      id: 'start-store',
      title: 'Start Your Store',
      subtitle: 'Your business. Your way.',
      icon: Store,
      targetId: 'affiliate',
    },
    {
      id: 'earn-5-levels',
      title: 'Earn From 5 Levels',
      subtitle: 'Build your team. Grow together.',
      icon: Users,
      targetId: 'affiliate',
    },
  ];

  const handleBenefitClick = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="max-w-[1460px] mx-auto px-3 sm:px-6 pt-1 sm:pt-2.5 pb-2.5">
      {/* Outer Banner Card matching the client reference layout */}
      <div className="relative rounded-[24px] sm:rounded-[30px] lg:rounded-[34px] overflow-hidden border border-[#eedde6] shadow-[0_18px_48px_rgba(50,31,63,0.08)] bg-[#fcf9f8] transition-all">

        {/* TOP HERO AREA: FULL COVER PANORAMIC LIFESTYLE BANNER */}
        <div className="relative min-h-[350px] sm:min-h-[380px] md:min-h-[410px] lg:min-h-[440px] xl:min-h-[460px] flex items-center overflow-hidden">

          {/* Full Cover Panoramic Master Banner - Natural 0% Extra Brightness on Left Side */}
          <img
            src="/assets/ilovesurprises/hero/hero-image-main.jpeg"
            alt="I Love Surprises Fall In Love With The Surprise Luxury Lifestyle Composition"
            className="absolute inset-0 w-full h-full object-cover object-[82%_center] sm:object-[78%_center] md:object-[74%_center] lg:object-center select-none transform-gpu backface-hidden [transform:translateZ(0)]"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />

          {/* High-Luminosity Reveal Layer - Masked so Left Side has 0% extra brightness, Center/Right illuminated */}
          <img
            src="/assets/ilovesurprises/hero/hero-image-main.jpeg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-[82%_center] sm:object-[78%_center] md:object-[74%_center] lg:object-center select-none brightness-[1.24] contrast-[1.04] saturate-[1.05] transform-gpu backface-hidden [transform:translateZ(0)] pointer-events-none [mask-image:linear-gradient(to_right,transparent_0%,transparent_32%,black_58%,black_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,transparent_32%,black_58%,black_100%)]"
            loading="eager"
            decoding="async"
          />

          {/* Protective Left Gradient - Zero disturbance behind heading & subtitle with seamless fade to right */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#fcf9f8]/98 via-[#fcf9f8]/90 via-36% sm:via-[#fcf9f8]/78 sm:via-46% md:via-[#fcf9f8]/55 md:via-52% to-transparent pointer-events-none"
          />

          {/* Additional soft gradient from top on mobile to ensure crisp headline readability */}
          <div
            aria-hidden="true"
            className="block sm:hidden absolute inset-0 bg-gradient-to-b from-[#fcf9f8]/95 via-[#fcf9f8]/80 to-transparent pointer-events-none"
          />

          {/* Content Container (Left Side Typography & CTAs) */}
          <div className="relative z-10 w-full px-5 sm:px-8 lg:pl-14 lg:pr-6 py-5 sm:py-6 lg:py-8 text-left">
            <div className="max-w-[580px] lg:max-w-[620px]">


              {/* Main Headline - Oleo Script Typography */}
              <h1 className="m-0 select-none font-oleo" style={{ fontFamily: "'Oleo Script', cursive, serif" }}>
                <span
                  style={{ fontFamily: "'Oleo Script', cursive, serif" }}
                  className="block font-oleo text-[32px] sm:text-[38px] md:text-[44px] lg:text-[50px] xl:text-[54px] text-[#141219] leading-[1.08] tracking-normal"
                >
                  Fall In Love With
                </span>
                <span
                  style={{ fontFamily: "'Oleo Script', cursive, serif" }}
                  className="block font-oleo text-[40px] sm:text-[48px] md:text-[54px] lg:text-[60px] xl:text-[68px] text-[#D30915] mt-0.5 leading-[1.04] tracking-normal drop-shadow-[0_4px_16px_rgba(211,9,21,0.22)]"
                >
                  The Surprise
                </span>
              </h1>

              {/* Short Supporting Text - Bold, rich contrast */}
              <p className="mt-2 sm:mt-2.5 text-[14px] sm:text-[15px] lg:text-[16px] leading-[1.55] text-[#241e2b] font-bold max-w-[500px] m-0">
                Hidden treasures. Joyful reveals. Real diamond &amp; gold jewelry tucked inside luxury soy candles and bath rituals.
              </p>

              {/* Social Proof Stars - Slightly increased */}
              <div className="mt-2.5 sm:mt-3 flex items-center gap-2 text-xs sm:text-[13px] font-bold text-[#554f5a]">
                <div className="flex items-center text-amber-400 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-[#141219] font-black">4.9/5</span>
                <span className="text-[#c8bec7]">•</span>
                <span>25,000+ Verified Reveals</span>
              </div>

              {/* Action CTA Buttons - Slightly increased, strictly on the same line */}
              <div className="mt-3.5 sm:mt-4.5 flex flex-nowrap items-center gap-2.5 sm:gap-3.5 overflow-x-auto sm:overflow-visible no-scrollbar pb-0.5 sm:pb-0">
                {/* Primary CTA */}
                <a
                  href="#featured"
                  onClick={handleShopClick}
                  className="group whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4.5 sm:px-6 py-2.5 sm:py-3.5 rounded-[13px] bg-gradient-to-r from-[#D30915] to-[#eb111e] hover:from-[#b60711] hover:to-[#D30915] text-white font-bold text-[11.5px] sm:text-[13.5px] uppercase tracking-wider shadow-[0_6px_22px_rgba(211,9,21,0.32)] hover:shadow-[0_10px_26px_rgba(211,9,21,0.44)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  <span>Shop Surprises</span>
                  <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                </a>

                {/* Secondary CTA */}
                <a
                  href="#affiliate"
                  onClick={handleConsultantClick}
                  className="group whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3.5 rounded-[13px] bg-white/95 hover:bg-white border border-[#d6cbd3] hover:border-[#D30915] text-[#141219] hover:text-[#D30915] font-bold text-[11.5px] sm:text-[13.5px] uppercase tracking-wider shadow-2xs hover:shadow-[0_6px_18px_rgba(50,31,63,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  <span>Become a <span className="hidden min-[440px]:inline">Surprise </span>Consultant</span>
                  <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>

            </div>
          </div>

        </div>

        {/* BENEFIT STRIP DIRECTLY BELOW HERO */}
        <div className="border-t border-[#f0e3ea] bg-white/98 backdrop-blur-xs px-3 sm:px-8 py-2.5 sm:py-3 transition-all">
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6 lg:gap-4 lg:divide-x lg:divide-[#f0e2ea] items-center">
            {benefitItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleBenefitClick(item.targetId)}
                  className="group flex items-center gap-3 sm:gap-3.5 py-1.5 px-2 sm:px-3 text-left rounded-xl transition-all duration-200 hover:bg-[#fff7f9] cursor-pointer"
                >
                  {/* Thin Outline Icon matching Reference */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#faf4f7] border border-[#f0e3ec] group-hover:border-[#D30915]/30 group-hover:bg-[#fff1f3] text-[#141219] group-hover:text-[#D30915] flex items-center justify-center shrink-0 transition-all duration-200">
                    <IconComponent className="w-5 h-5 stroke-[1.6]" />
                  </div>

                  {/* Title & Supporting Text */}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[13px] sm:text-[14px] font-bold text-[#141219] group-hover:text-[#D30915] leading-snug tracking-tight truncate m-0 transition-colors">
                      {item.title}
                    </h2>
                    <p className="text-[11px] sm:text-[12px] text-[#716d77] leading-tight mt-0.5 truncate font-medium m-0">
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};

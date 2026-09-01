import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type { Order } from '../../types';

interface OrderSuccessPopupModalProps {
  order: Order;
  isOpen: boolean;
  onProceedToConfirmation: () => void;
}

// 12 luxury celebration particles with 3D physics coordinates
const PARTICLES = [
  { id: 1, tx: '-58px', ty: '-54px', s: '1.2', r: '240deg', color: '#f59e0b', icon: '●' },
  { id: 2, tx: '60px', ty: '-52px', s: '1.3', r: '180deg', color: '#ec2f73', icon: '◆' },
  { id: 3, tx: '-68px', ty: '0px', s: '1.0', r: '120deg', color: '#10b981', icon: '●' },
  { id: 4, tx: '70px', ty: '12px', s: '1.1', r: '300deg', color: '#f59e0b', icon: '◆' },
  { id: 5, tx: '-48px', ty: '58px', s: '1.2', r: '210deg', color: '#ec2f73', icon: '◆' },
  { id: 6, tx: '52px', ty: '56px', s: '1.3', r: '150deg', color: '#10b981', icon: '●' },
  { id: 7, tx: '0px', ty: '-72px', s: '1.1', r: '360deg', color: '#ec2f73', icon: '●' },
  { id: 8, tx: '0px', ty: '72px', s: '1.2', r: '180deg', color: '#f59e0b', icon: '◆' },
  { id: 9, tx: '-36px', ty: '-66px', s: '0.9', r: '90deg', color: '#10b981', icon: '●' },
  { id: 10, tx: '40px', ty: '-64px', s: '0.9', r: '270deg', color: '#f59e0b', icon: '◆' },
  { id: 11, tx: '-64px', ty: '38px', s: '1.0', r: '45deg', color: '#ec2f73', icon: '●' },
  { id: 12, tx: '66px', ty: '38px', s: '1.0', r: '315deg', color: '#10b981', icon: '◆' },
];

export const OrderSuccessPopupModal: React.FC<OrderSuccessPopupModalProps> = ({
  order,
  isOpen,
  onProceedToConfirmation,
}) => {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(4);

  const isCod = order.paymentSummary.method === 'cod';

  // Handle countdown & auto-redirect
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onProceedToConfirmation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onProceedToConfirmation]);

  if (!isOpen) return null;

  const handleCopyOrderId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto bg-[#0a0710]/75 backdrop-blur-md animate-in fade-in duration-250"
    >
      {/* Modal Container */}
      <div className="relative w-full max-w-[540px] bg-white rounded-[32px] sm:rounded-[36px] p-6 sm:p-9 border border-[#f3dbe8] shadow-[0_24px_70px_rgba(20,18,25,0.4)] overflow-hidden text-center animate-in zoom-in-95 duration-300">
        
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-52 h-52 rounded-full bg-[#ec2f73]/12 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-amber-400/8 blur-3xl pointer-events-none" />

        {/* 1. DIGITAL PAYMENT SUCCESS ANIMATION ICON */}
        <div className="relative inline-flex items-center justify-center my-2 sm:my-3">
          
          {/* Concentric Triple Ripple Waves */}
          <div className="absolute w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-emerald-500/25 anim-success-ripple-1 pointer-events-none" />
          <div className="absolute w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-emerald-400/20 anim-success-ripple-2 pointer-events-none" />
          <div className="absolute w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-emerald-300/15 anim-success-ripple-3 pointer-events-none" />

          {/* Luxury Floating Particles / Confetti */}
          {PARTICLES.map((p) => (
            <div
              key={p.id}
              style={
                {
                  '--tx': p.tx,
                  '--ty': p.ty,
                  '--s': p.s,
                  '--r': p.r,
                  color: p.color,
                } as React.CSSProperties
              }
              className="anim-particle absolute select-none pointer-events-none font-bold text-xs"
            >
              {p.icon}
            </div>
          ))}

          {/* SVG Animated Circle & Checkmark with Gradient Fill */}
          <div className="anim-success-bounce relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-white to-[#f0fdf4] flex items-center justify-center shadow-[0_10px_32px_rgba(16,185,129,0.3)] border-2 border-emerald-100 z-10">
            <svg
              className="w-full h-full p-2"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="modalStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="modalCheckGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
              </defs>

              {/* Background circular track */}
              <circle
                cx="50"
                cy="50"
                r="43"
                stroke="#d1fae5"
                strokeWidth="5"
                strokeLinecap="round"
              />
              {/* Animated Drawing Circle */}
              <circle
                className="anim-success-circle"
                cx="50"
                cy="50"
                r="43"
                stroke="url(#modalStrokeGrad)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              {/* Animated Drawing Checkmark */}
              <path
                className="anim-success-check"
                d="M29 51.5 L42.5 65 L72.5 35"
                stroke="url(#modalCheckGrad)"
                strokeWidth="7.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* 2. SUCCESS TITLES & TRUST PILL */}
        <div className="anim-stagger-1 space-y-1.5 mt-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isCod ? 'Order Placed • Doorstep Verification' : 'Payment Confirmed & Verified'}</span>
          </div>

          <h2
            id="success-modal-title"
            className="text-xl sm:text-3xl font-black text-[#141219] font-display tracking-tight m-0"
          >
            Order Placed Successfully!
          </h2>

          <p className="text-xs sm:text-sm text-[#ec2f73] font-bold m-0 flex items-center justify-center gap-1.5">
            <span>Your surprise is being prepared with love!</span>
            <span>🎁</span>
          </p>
        </div>

        {/* 3. ORDER REFERENCE & RECEIPT PREVIEW CARD */}
        <div className="anim-stagger-2 mt-5 p-4 rounded-[20px] bg-[#fffafc] border border-[#f5cad7] text-left space-y-3">
          
          {/* Top Bar: Reference ID & Amount */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#f4e6ee]">
            <div>
              <span className="text-[10px] font-black uppercase text-[#716d77] block">
                Order Reference
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-mono font-black text-[#ec2f73]">
                  {order.id}
                </span>
                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  className="p-1 rounded-[6px] bg-white border border-[#ecdbe6] hover:bg-[#fff0f5] text-[#716d77] hover:text-[#ec2f73] cursor-pointer"
                  title="Copy Order ID"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-[#716d77] block">
                {isCod ? 'Amount Due' : 'Total Paid'}
              </span>
              <strong className="text-base sm:text-lg font-black text-[#141219]">
                ${order.total.toFixed(2)}
              </strong>
            </div>
          </div>

          {/* Delivery & Items Summary */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-[12px] bg-white border border-[#f2e2ec]">
              <span className="text-[9px] font-black uppercase text-[#716d77] block">
                Shipping To
              </span>
              <strong className="block text-[11px] font-bold text-[#141219] truncate">
                {order.shippingAddress.fullName}
              </strong>
              <span className="text-[10px] text-[#716d77] block truncate">
                {order.shippingAddress.city}, {order.shippingAddress.state}
              </span>
            </div>

            <div className="p-2.5 rounded-[12px] bg-white border border-[#f2e2ec]">
              <span className="text-[9px] font-black uppercase text-[#716d77] block">
                Est. Delivery
              </span>
              <strong className="block text-[11px] font-bold text-emerald-700 truncate">
                {order.estimatedDeliveryDate}
              </strong>
              <span className="text-[10px] text-[#716d77] block truncate">
                {order.deliveryMethod.name.split(' ')[0]} Tracked
              </span>
            </div>
          </div>
        </div>

        {/* 4. AUTO REDIRECT COUNTDOWN & ACTION BUTTONS */}
        <div className="anim-stagger-3 mt-5 space-y-2.5">
          
          {/* View Full Order Details Button */}
          <button
            type="button"
            onClick={onProceedToConfirmation}
            className="w-full h-[48px] rounded-[16px] bg-gradient-to-r from-[#ec2f73] to-[#d92467] hover:from-[#d92467] hover:to-[#c21a57] text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(236,47,115,0.32)] active:scale-97 transition-all cursor-pointer"
          >
            <span>View Full Order & Tracking</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Auto Redirect Progress Bar */}
          <div className="flex items-center justify-between text-[11px] font-bold text-[#716d77] px-1 pt-1">
            <span>Redirecting to receipt in {countdown}s...</span>
            <button
              type="button"
              onClick={onProceedToConfirmation}
              className="text-[#ec2f73] hover:underline font-black cursor-pointer"
            >
              Open now
            </button>
          </div>

          <div className="w-full h-1.5 bg-[#f4e8f0] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#ec2f73] to-emerald-500 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${((4 - countdown) / 4) * 100}%` }}
            />
          </div>

        </div>

      </div>
    </div>
  );
};

import React from 'react';

interface ThaiBankLogoProps {
  bankCode?: string;
  size?: number;
  className?: string;
}

export const ThaiBankLogo: React.FC<ThaiBankLogoProps> = ({
  bankCode = 'promptpay',
  size = 36,
  className = '',
}) => {
  const code = (bankCode || 'promptpay').toLowerCase();

  switch (code) {
    case 'promptpay':
      return (
        <img
          src="/promptpay.png"
          alt="พร้อมเพย์ (PromptPay)"
          width={size}
          height={size}
          className={`rounded-xl shrink-0 overflow-hidden shadow-xs object-cover select-none ${className}`}
          style={{ width: size, height: size }}
        />
      );

    case 'kbank':
      return (
        <img
          src="/kbank.png"
          alt="ธนาคารกสิกรไทย (KBANK)"
          width={size}
          height={size}
          className={`rounded-xl shrink-0 overflow-hidden shadow-xs object-cover select-none ${className}`}
          style={{ width: size, height: size }}
        />
      );

    case 'scb':
      return (
        <img
          src="/scb.png"
          alt="ธนาคารไทยพาณิชย์ (SCB)"
          width={size}
          height={size}
          className={`rounded-xl shrink-0 overflow-hidden shadow-xs object-cover select-none ${className}`}
          style={{ width: size, height: size }}
        />
      );

    case 'bbl':
      return (
        <img
          src="/bbl.png"
          alt="ธนาคารกรุงเทพ (BBL)"
          width={size}
          height={size}
          className={`rounded-xl shrink-0 overflow-hidden shadow-xs object-cover select-none ${className}`}
          style={{ width: size, height: size }}
        />
      );

    case 'ktb':
      return (
        <img
          src="/ktb.png"
          alt="ธนาคารกรุงไทย (KTB)"
          width={size}
          height={size}
          className={`rounded-xl shrink-0 overflow-hidden shadow-xs object-cover select-none ${className}`}
          style={{ width: size, height: size }}
        />
      );

    case 'bay':
      return (
        <img
          src="/bay.png"
          alt="ธนาคารกรุงศรีอยุธยา (BAY)"
          width={size}
          height={size}
          className={`rounded-xl shrink-0 overflow-hidden shadow-xs object-cover select-none ${className}`}
          style={{ width: size, height: size }}
        />
      );

    case 'ttb':
      return (
        <img
          src="/ttb.png"
          alt="ธนาคารทหารไทยธนชาต (TTB)"
          width={size}
          height={size}
          className={`rounded-xl shrink-0 overflow-hidden shadow-xs object-cover select-none ${className}`}
          style={{ width: size, height: size }}
        />
      );

    case 'gsb':
      return (
        <img
          src="/gsb.png"
          alt="ธนาคารออมสิน (GSB)"
          width={size}
          height={size}
          className={`rounded-xl shrink-0 overflow-hidden shadow-xs object-cover select-none ${className}`}
          style={{ width: size, height: size }}
        />
      );

    case 'baac':
      return (
        <img
          src="/baac.png"
          alt="ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)"
          width={size}
          height={size}
          className={`rounded-xl shrink-0 overflow-hidden shadow-xs object-cover select-none ${className}`}
          style={{ width: size, height: size }}
        />
      );

    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`rounded-xl shrink-0 overflow-hidden shadow-xs ${className}`}
        >
          <rect width="100" height="100" rx="22" fill="#475569" />
          <g fill="#FFFFFF">
            <path d="M50 24L26 38V42H74V38L50 24Z" />
            <rect x="30" y="46" width="6" height="24" rx="2" />
            <rect x="42" y="46" width="6" height="24" rx="2" />
            <rect x="54" y="46" width="6" height="24" rx="2" />
            <rect x="66" y="46" width="6" height="24" rx="2" />
            <rect x="24" y="74" width="52" height="6" rx="2" />
          </g>
        </svg>
      );
  }
};

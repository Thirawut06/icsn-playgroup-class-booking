import React from 'react';

export const GoogleDriveIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 800 741.3696" fill="none" xmlns="http://www.w3.org/2000/svg">
    <mask id="drive-mask" width="168" height="154" x="12" y="18" maskUnits="userSpaceOnUse">
      <path fill="#fff" d="M63.09 37c14.626-25.333 51.193-25.334 65.819 0l45.033 78c14.626 25.334-3.657 57.001-32.91 57.001H50.967c-29.253 0-47.536-31.667-32.91-57.001Z"/>
    </mask>
    <g mask="url(#drive-mask)" transform="matrix(4.8140532,0,0,4.8140532,-62.146701,-86.652356)">
      <path fill="url(#drive-b)" d="M206.905 172.02h-91.888l-19.015-32.934 45.944-79.578Z"/>
      <path fill="url(#drive-c)" d="M-14.919 172.006 50.04 59.494v.002L31.032 92.422h38.02L115 172.004l-129.918.001Z"/>
      <path fill="url(#drive-d)" d="M96.007-20.085 141.954 59.5l-19.011 32.928H31.048Z"/>
    </g>
    <defs>
      <linearGradient id="drive-b" x1="193.6" x2="103.09" y1="165.6" y2="111.21" gradientUnits="userSpaceOnUse">
        <stop offset=".09" stopColor="#ffe921"/>
        <stop offset="1" stopColor="#fec700"/>
      </linearGradient>
      <linearGradient id="drive-c" x1="114.4" x2="15.53" y1="181.61" y2="121.8" gradientUnits="userSpaceOnUse">
        <stop offset=".15" stopColor="#a9a8ff"/>
        <stop offset=".33" stopColor="#6d97ff"/>
        <stop offset=".48" stopColor="#3186ff"/>
      </linearGradient>
      <linearGradient id="drive-d" x1="128.88" x2="28.7" y1="37.88" y2="84.64" gradientUnits="userSpaceOnUse">
        <stop offset=".55" stopColor="#0ebc5f"/>
        <stop offset=".85" stopColor="#78c9ff"/>
      </linearGradient>
    </defs>
  </svg>
);

export const GoogleSheetsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 800 581.8182" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="#009954" d="M0 193.6364c0-40.65 0-60.9773 6.3818-77.1a90.91 90.91 0 0 1 51.0637-51.0591c16.1227-6.3864 36.4454-6.3864 77.1-6.3864H410.909c40.65 0 60.9773 0 77.1 6.3818a90.91 90.91 0 0 1 51.0636 51.0637c6.3818 16.1227 6.3818 36.4454 6.3818 77.1v194.5454c0 40.65 0 60.9773-6.3818 77.1a90.91 90.91 0 0 1-51.0636 51.0637c-16.1227 6.3818-36.45 6.3818-77.1 6.3818H134.5454c-40.65 0-60.9772 0-77.1045-6.3818a90.91 90.91 0 0 1-51.059-51.0637C0 449.1591 0 428.8318 0 388.1818Z"/>
    <mask id="sheets-mask" width="160" height="128" x="24" y="32" maskUnits="userSpaceOnUse">
      <rect width="160" height="128" x="24" y="32" fill="#fff" rx="20"/>
    </mask>
    <g mask="url(#sheets-mask)" transform="matrix(4.5454545,0,0,4.5454545,-36.363636,-145.45454)">
      <path fill="#0ebc5f" d="M24 32h160v128H24Z"/>
      <g filter="url(#sheets-filter)">
        <rect width="144" height="102" fill="url(#sheets-c)" rx="25.6" transform="matrix(1,0,0,-1,8,147)" x="0" y="0"/>
      </g>
    </g>
    <path stroke="#ffffff" strokeLinecap="round" strokeWidth="54.5455" d="M327.2727 404.5455H709.091m-90.909 86.3636v-290.909"/>
    <defs>
      <linearGradient id="sheets-c" x1="122.24" x2="20.76" y1="43.31" y2="43.31" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0ebc5f"/>
        <stop offset=".95" stopColor="#78c9ff"/>
      </linearGradient>
      <filter id="sheets-filter" width="168" height="126" x="-4" y="33" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" mode="normal"/>
        <feGaussianBlur result="effect1_foregroundBlur_37435_8174" stdDeviation="6"/>
      </filter>
    </defs>
  </svg>
);

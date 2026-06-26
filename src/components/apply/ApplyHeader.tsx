import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ApplyHeaderProps {
  showSuccess: boolean;
  path: string | null;
  setPath: (path: 'trial' | 'payment' | null) => void;
}

export function ApplyHeader({ showSuccess, path, setPath }: ApplyHeaderProps) {
  const router = useRouter();

  return (
    <div 
      className="bg-[#211551] px-6 py-8 text-white text-center relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: 'url("/playgroup-banner-icsn.png")' }}
    >
      <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
      {(!showSuccess && path) ? (
        <button onClick={() => setPath(null)} className="absolute top-4 left-4 z-20 text-white hover:text-gray-200 cursor-pointer">
          <ArrowLeft className="w-6 h-6" />
        </button>
      ) : (
        <button onClick={() => {
          if (typeof window !== 'undefined' && localStorage.getItem('icsn_parent_id')) {
            router.push('/book');
          } else {
            router.push('/');
          }
        }} className="absolute top-4 left-4 z-20 text-white hover:text-gray-200 cursor-pointer">
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}

      <div className="inline-flex items-center justify-center w-20 h-auto mb-3 relative z-10">
        <img src="/white-main-logo-icsn.png" alt="ICSN Logo" className="w-full h-auto object-contain drop-shadow-sm" />
      </div>
      <h1 className="text-[22px] font-bold text-white relative z-10 drop-shadow-md">
        ICSN Panda Playgroup
      </h1>
      <p className="text-[13px] font-medium text-white/90 mt-0.5 relative z-10 drop-shadow-md">
        Registration Form (แบบฟอร์มลงทะเบียนเรียน)
      </p>
    </div>
  );
}

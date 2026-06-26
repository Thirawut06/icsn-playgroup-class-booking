import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface SuccessScreenProps {
  path: string | null;
}

export function SuccessScreen({ path }: SuccessScreenProps) {
  const router = useRouter();

  return (
    <div className="px-5 py-10 relative z-10 flex-1 flex flex-col justify-center items-center text-center">
      <div className="w-20 h-20 bg-[#00B0B9]/10 text-[#00B0B9] rounded-full flex items-center justify-center mb-6">
        <Check className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-[#211551] mb-2">เธฅเธเธ—เธฐเน€เธเธตเธขเธเธชเธณเน€เธฃเนเธ!</h2>
      
      {path === 'trial' && (
        <p className="text-gray-600 text-lg leading-relaxed mb-8">
          เธฃเธฐเธเธเนเธ”เนเธเธฑเธเธ—เธถเธเธเนเธญเธกเธนเธฅเธเธญเธเธ—เนเธฒเธเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง<br/>
          เธชเธฒเธกเธฒเธฃเธ–เน€เธฅเธทเธญเธเธงเธฑเธเน€เธฃเธตเธขเธเธ—เธ”เธฅเธญเธเนเธ”เนเธ—เธตเนเธเธเธดเธ—เธดเธเธเธญเธเธเธฅเธฒเธช
        </p>
      )}
      {path === 'payment' && (
        <p className="text-gray-600 text-lg leading-relaxed mb-8">
          เธชเธฅเธดเธเธเธญเธเธ—เนเธฒเธเธเธฐเนเธ”เนเธฃเธฑเธเธเธฒเธฃเธ•เธฃเธงเธเธชเธญเธเธ เธฒเธขเนเธ 24 เธเธก.<br/>
          เน€เธกเธทเนเธญเธญเธเธธเธกเธฑเธ•เธดเนเธฅเนเธงเธ—เนเธฒเธเธเธฐเธชเธฒเธกเธฒเธฃเธ–เธเธญเธเธเธฅเธฒเธชเนเธ”เนเธ—เธฑเธเธ—เธต
        </p>
      )}

      <Button
        onClick={() => router.push('/book')}
        className="w-full bg-[#00B0B9] text-white font-bold py-3.5 px-6 rounded-xl flex flex-col items-center justify-center hover:bg-[#00969e] h-auto"
      >
        <span className="text-lg">เนเธเธ—เธตเนเธเธเธดเธ—เธดเธเธเธญเธเธเธฅเธฒเธช</span>
      </Button>
    </div>
  );
}


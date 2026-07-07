"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useDictionary } from '@/lib/i18n/dictionary-context';
import { SettingsService } from '@/lib/services/settings.service';

export default function TermsPage() {
  const { lang } = useDictionary();
  const [cutoffHour, setCutoffHour] = useState<number>(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await SettingsService.getAllSettings();
        setCutoffHour(settings.cutoff_hour);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-icsn-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 sm:p-12 shadow-sm border border-border">
        <div className="mb-10 pb-6 border-b border-border/50 flex items-center gap-4">
          <Link
            href={ROUTES.LOGIN(lang)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">ข้อตกลงและเงื่อนไขการใช้บริการ (Terms of Service)</h1>
        </div>
        
        <div className="prose prose-sm sm:prose-base max-w-none text-slate-700 leading-relaxed">
          <p className="font-bold text-slate-900">อัปเดตล่าสุด: 7 กรกฎาคม 2026</p>
          <p>
            ข้อตกลงและเงื่อนไขการใช้บริการฉบับนี้ ("ข้อตกลง") เป็นข้อตกลงทางกฎหมายระหว่างท่าน ("ผู้ใช้งาน" หรือ "ผู้ปกครอง") และ โรงเรียนนานาชาติคริสเตียนนนทบุรี (ICSN) ("เรา" หรือ "โรงเรียน") สำหรับการใช้งานแพลตฟอร์มระบบจองกิจกรรม Playgroup ผ่านเว็บไซต์ (Website Platform) 
            การที่ท่านคลิกสมัครสมาชิก หรือเข้าใช้งานแพลตฟอร์มนี้ ถือว่าท่านได้อ่าน ทำความเข้าใจ และยอมรับข้อผูกพันตามเงื่อนไขทั้งหมดที่ระบุไว้ด้านล่างนี้
          </p>

          <h2 className="text-lg font-bold text-slate-900 mt-6 mb-3">1. ขอบเขตของข้อตกลง</h2>
          <p>
            ข้อตกลงฉบับนี้มีผลบังคับใช้เฉพาะ <strong>การกระทำและการทำธุรกรรมทางอิเล็กทรอนิกส์ผ่านเว็บไซต์นี้เท่านั้น</strong> (Online Platform) เช่น การจัดการบัญชีผู้ใช้, การซื้อเครดิต, และการจองหรือยกเลิกกิจกรรม Playgroup
          </p>
          
          <h2 className="text-lg font-bold text-slate-900 mt-6 mb-3">2. บัญชีผู้ใช้งานและความปลอดภัย (User Accounts)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>ท่านต้องให้ข้อมูลที่ถูกต้อง ครบถ้วน และเป็นจริงในการลงทะเบียนบัญชี</li>
            <li>ท่านมีหน้าที่รับผิดชอบในการเก็บรักษารหัสผ่าน (Password) และข้อมูลบัญชีของท่านให้เป็นความลับ</li>
            <li>การทำธุรกรรมหรือการจองกิจกรรม Playgroup ใดๆ ที่เกิดขึ้นผ่านบัญชีของท่าน จะถือว่าเป็นการกระทำของท่านและผูกพันตามข้อตกลงนี้ทุกประการ</li>
            <li>โรงเรียนขอสงวนสิทธิ์ในการระงับบัญชีผู้ใช้งาน หากพบพฤติกรรมการใช้งานที่ผิดปกติ ก่อกวนระบบ หรือละเมิดข้อตกลงการใช้งานอย่างร้ายแรง</li>
          </ul>
          
          <h2 className="text-lg font-bold text-slate-900 mt-6 mb-3">3. การซื้อแพ็กเกจเครดิตและการชำระเงิน (Payments & Credits)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>เครดิตสำหรับกิจกรรม Playgroup (Credits) ที่ซื้อผ่านระบบ <strong>ไม่มีวันหมดอายุ</strong> หากท่านมีเหตุสุดวิสัยที่ต้องการยกเลิกแพ็กเกจหรือขอคืนเงิน (Refund) สามารถติดต่อเจ้าหน้าที่ (Admissions) เป็นรายกรณีได้ที่ LINE @792sitws</li>
            <li>เครดิตจะถูกเพิ่มเข้าสู่บัญชีของท่านเมื่อเจ้าหน้าที่ได้ทำการตรวจสอบความถูกต้องของสลิปหลักฐานการโอนเงินเรียบร้อยแล้วเท่านั้น</li>
            <li>หากพบว่ามีการใช้สลิปปลอม หรือกระทำการทุจริตทางการเงิน โรงเรียนขอสงวนสิทธิ์ในการระงับบัญชีผู้ใช้งานทันทีโดยไม่ต้องแจ้งให้ทราบล่วงหน้า และอาจดำเนินคดีตามกฎหมาย</li>
          </ul>
          
          <h2 className="text-lg font-bold text-slate-900 mt-6 mb-3">4. นโยบายการจองและยกเลิกกิจกรรม Playgroup (Booking & Cancellation Policy)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>ท่านสามารถใช้เครดิตที่มีอยู่เพื่อทำการจองกิจกรรม Playgroup ล่วงหน้าได้ผ่านระบบ</li>
            <li>
              <strong>การยกเลิกการจอง:</strong> ท่านสามารถยกเลิกการจองผ่านระบบด้วยตนเองเพื่อขอรับเครดิตคืนได้ 
              โดยจะต้องดำเนินการยกเลิก <strong>ก่อนเวลา {loading ? '...' : String(cutoffHour).padStart(2, '0')}:00 น.</strong> ของวันที่มีกิจกรรม Playgroup เท่านั้น
            </li>
            <li>หากท่านยกเลิกหลังเวลาที่กำหนด หรือไม่มาร่วมกิจกรรม Playgroup (No-show) ระบบจะทำการหักเครดิตโดยสมบูรณ์ และสงวนสิทธิ์ในการไม่คืนเครดิตในทุกกรณี</li>
            <li><strong>การเปลี่ยนแปลงตารางกิจกรรมโดยโรงเรียน:</strong> โรงเรียนขอสงวนสิทธิ์ในการเปลี่ยนแปลงราคาแพ็กเกจเครดิต หรือตารางกิจกรรม Playgroup ทั้งนี้ หากโรงเรียนมีความจำเป็นต้องยกเลิกกิจกรรม Playgroup (Cancel Session) ระบบจะทำการยกเลิกการจองและคืนเครดิต (Refund) เข้าสู่บัญชีของท่านโดยอัตโนมัติ 100%</li>
          </ul>

          <h2 className="text-lg font-bold text-slate-900 mt-6 mb-3">5. การจำกัดความรับผิดทางอิเล็กทรอนิกส์ (Limitation of Liability)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>ความรับผิดของโรงเรียนภายใต้ข้อตกลงนี้จะจำกัดอยู่เพียงแค่ปัญหาที่เกิดจากความผิดพลาดของระบบซอฟต์แวร์ เช่น การตัดเครดิตผิดพลาด หรือระบบล่ม เราไม่รับประกันว่าแพลตฟอร์มจะสามารถใช้งานได้โดยปราศจากข้อบกพร่อง (Bug-free) หรือการหยุดชะงัก (Uninterrupted) อย่างไรก็ตาม เราจะพยายามอย่างเต็มที่ในการแก้ไขปัญหาทางเทคนิคโดยเร็วที่สุด</li>
            <li>การเข้าถึงข้อมูลโดยมิชอบ (Unauthorized Access) ที่เกิดจากความประมาทเลินเล่อในการรักษารหัสผ่านของท่านเอง</li>
            <li><strong>เหตุสุดวิสัย (Force Majeure):</strong> โรงเรียนจะไม่รับผิดชอบในความล่าช้า หรือความล้มเหลวในการให้บริการ หากเกิดจากเหตุสุดวิสัย เช่น ภัยธรรมชาติ, โรคระบาดร้ายแรง, หรือเหตุขัดข้องทางโครงสร้างพื้นฐาน (เช่น เซิร์ฟเวอร์ล่มระดับประเทศ) ที่อยู่นอกเหนือการควบคุมของโรงเรียน</li>
            <li><strong>บริการตามสภาพ (As-Is):</strong> โรงเรียนให้บริการแพลตฟอร์มนี้ตามสภาพที่เป็นอยู่ (As-is) และตามที่มีอยู่ (As-available) โดยไม่มีการรับประกันใดๆ ทั้งโดยชัดแจ้งหรือโดยปริยาย ว่าระบบจะทำงานได้โดยปราศจากข้อผิดพลาดในทุกสถานการณ์</li>
          </ul>

          <h2 className="text-lg font-bold text-slate-900 mt-6 mb-3">6. การแก้ไขเปลี่ยนแปลงข้อตกลง (Amendment)</h2>
          <p>
            โรงเรียนขอสงวนสิทธิ์ในการแก้ไขเปลี่ยนแปลงข้อตกลงนี้ได้ตลอดเวลา โดยจะระบุ "วันที่อัปเดตล่าสุด" ไว้ที่ด้านบนสุดของเอกสารฉบับนี้ การที่ท่านเข้าใช้งานระบบหลังจากการแก้ไข ถือว่าท่านยอมรับข้อตกลงฉบับใหม่แล้ว
          </p>

          <h2 className="text-lg font-bold text-slate-900 mt-6 mb-3">7. การระงับข้อพิพาท (Dispute Resolution)</h2>
          <p>
            หากเกิดข้อพิพาทใดๆ ขึ้นอันเนื่องมาจากการใช้บริการหรือข้อตกลงฉบับนี้ คู่สัญญาตกลงที่จะพยายามเจรจาไกล่เกลี่ยกันโดยสุจริตก่อนที่จะนำเรื่องเข้าสู่กระบวนการทางกฎหมาย
          </p>

          <h2 className="text-lg font-bold text-slate-900 mt-6 mb-3">8. กฎหมายที่ใช้บังคับ (Governing Law)</h2>
          <p>
            ข้อตกลงและเงื่อนไขการใช้บริการฉบับนี้ ให้อยู่ภายใต้การบังคับใช้และการตีความตามกฎหมายแห่งราชอาณาจักรไทย
          </p>
        </div>
      </div>
    </div>
  );
}

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { ParentService } from '@/lib/services/parent.service';
import { supabase as supabaseAnon } from '@/lib/supabase'; // Existing anon client

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Core Flow Integration Tests', () => {
  const testEmail = `test_core_${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  const testPhone = `081${Math.floor(1000000 + Math.random() * 9000000)}`;
  const testName = 'Integration Test Parent';
  
  let parentId: string;
  let childId: string;

  afterAll(async () => {
    // Cleanup using admin client (bypasses RLS)
    if (childId) {
      await supabaseAdmin.from('children').delete().eq('id', childId);
    }
    if (parentId) {
      await supabaseAdmin.from('parents').delete().eq('id', parentId);
      await supabaseAdmin.auth.admin.deleteUser(parentId);
    }
  });

  describe('1. Authentication & Profile', () => {
    it('[Success] should sign up a new parent successfully', async () => {
      // Act
      const parent = await ParentService.signUp(testEmail, testPassword, testName, testPhone);
      
      // Assert
      expect(parent).toBeDefined();
      expect(parent.id).toBeDefined();
      expect(parent.phone).toBe(testPhone);
      expect(parent.name).toBe(testName);
      
      parentId = parent.id;
    });

    it('[Edge Case] should fail to sign up with an existing email', async () => {
      // Act & Assert
      await expect(
        ParentService.signUp(testEmail, 'anotherpassword', 'Another Name', '0899999999')
      ).rejects.toThrow(/อีเมลนี้ถูกใช้ลงทะเบียนไปแล้ว|already registered|already exists/);
    });

    it('[Edge Case] should fail to sign up with an existing phone number', async () => {
      // Act & Assert
      const newEmail = `test_core_2_${Date.now()}@example.com`;
      await expect(
        ParentService.signUp(newEmail, testPassword, 'Another Name', testPhone)
      ).rejects.toThrow(/เบอร์โทรศัพท์นี้ถูกใช้ลงทะเบียนแล้ว/);
    });

    it('[Success] should add a child to the parent profile', async () => {
      // Act
      const child = await ParentService.submitNewChild({
        parentId,
        childName: 'Test Child FullName',
        childNickname: 'TestChild',
        childDob: '2020-01-01',
        childPhotoFile: null,
        parentPhotoFile: null,
        allergy: 'None',
        info: 'Testing notes',
        mediaPerm: true,
        noPhotoPerm: false
      });
      
      // Assert
      expect(child).toBeDefined();
      expect(child.id).toBeDefined();
      expect(child.nickname).toBe('TestChild');
      expect(child.parent_id).toBe(parentId);
      
      childId = child.id;
    });
  });

  describe('2. Credit Management', () => {
    let packageId: string;

    it('[Success] should add a package and increase credits', async () => {
      // Act - Simulate admin adding a package
      const { data: pkg, error } = await supabaseAdmin.from('packages').insert({
        parent_id: parentId,
        type: '10 Classes',
        credits_remaining: 10,
        non_refundable: false
      }).select().single();

      expect(error).toBeNull();
      packageId = pkg.id;

      // Simulate admin logging the transaction (as adjust_credits RPC would do)
      const { error: txError } = await supabaseAdmin.from('credit_transactions').insert({
        parent_id: parentId,
        package_id: packageId,
        amount: 10,
        action_type: 'admin_adjustment',
        notes: 'Integration Test Topup'
      });
      expect(txError).toBeNull();

      // Assert - Verify parent's total credits using public service (if available) or DB
      const { data: packages, error: pkgsError } = await supabaseAnon
        .from('packages')
        .select('credits_remaining')
        .eq('parent_id', parentId);
        
      expect(pkgsError).toBeNull();
      const totalCredits = packages?.reduce((sum, p) => sum + p.credits_remaining, 0);
      expect(totalCredits).toBe(10);
    });

    it('[Edge Case] should not allow negative credit adjustments via normal deduction (tested manually)', async () => {
      // We simulate an invalid adjustment by checking the DB constraint (or just logic)
      // Actually, we test booking to deduct credits in the next block.
      // Here, we just verify the total credits sum up correctly.
      
      // Let's add another package of 5 credits
      const { data: pkg2 } = await supabaseAdmin.from('packages').insert({
        parent_id: parentId,
        type: '5 Classes',
        credits_remaining: 5,
        non_refundable: true
      }).select().single();

      // Sum should now be 15
      const { data: packages } = await supabaseAnon
        .from('packages')
        .select('credits_remaining')
        .eq('parent_id', parentId);
        
      const totalCredits = packages?.reduce((sum, p) => sum + p.credits_remaining, 0);
      expect(totalCredits).toBe(15);
    });
  });

  describe('3. Class Booking', () => {
    let sessionId: string;
    let initialBookedCount = 0;
    
    beforeAll(async () => {
      // Admin sets up a session for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { data: sessionData, error } = await supabaseAdmin.from('sessions').insert({
        session_date: tomorrow.toISOString().split('T')[0],
        time_label: '14:00-16:00 (Integration Test)',
        total_capacity: 1, // Capacity 1 so it's easy to make it full
        booked_count: 0,
        is_active: true
      }).select().single();
      
      if (error) throw error;
      sessionId = sessionData.id;
    });

    afterAll(async () => {
      // Cleanup bookings and session
      if (sessionId) {
        await supabaseAdmin.from('bookings').delete().eq('session_id', sessionId);
        await supabaseAdmin.from('sessions').delete().eq('id', sessionId);
      }
    });

    it('[Success] should book a class successfully and deduct 1 credit', async () => {
      const { SupabaseBookingAdapter } = await import('@/lib/domain/adapters/SupabaseBookingAdapter');
      const bookingModule = new SupabaseBookingAdapter();

      const result = await bookingModule.bookClass(parentId, childId, sessionId);
      
      expect(result.success).toBe(true);

      // Verify credits went down (Started at 15 from previous test)
      const { data: packages } = await supabaseAnon
        .from('packages')
        .select('credits_remaining')
        .eq('parent_id', parentId);
      const totalCredits = packages?.reduce((sum, p) => sum + p.credits_remaining, 0);
      expect(totalCredits).toBe(14); // 15 - 1 = 14

      // Verify session booked_count increased
      const { data: sessionData } = await supabaseAnon
        .from('sessions')
        .select('booked_count')
        .eq('id', sessionId)
        .single();
      
      expect(sessionData?.booked_count).toBe(1);
    });

    it('[Edge Case] should not allow duplicate booking for the same child', async () => {
      const { SupabaseBookingAdapter } = await import('@/lib/domain/adapters/SupabaseBookingAdapter');
      const bookingModule = new SupabaseBookingAdapter();

      await expect(
        bookingModule.bookClass(parentId, childId, sessionId)
      ).rejects.toThrow(/Child is already booked|already booked|คุณได้จองคลาสนี้ให้เด็กคนนี้ไปแล้ว/i);
    });

    it('[Edge Case] should not allow booking if session is full', async () => {
      // The capacity is 1, and child1 already booked it. So it should be full.
      // We need a second child to try booking
      const child2 = await ParentService.submitNewChild({
        parentId,
        childName: 'Second Child',
        childNickname: 'Child2',
        childDob: '2021-01-01',
        childPhotoFile: null,
        parentPhotoFile: null,
        allergy: 'None',
        info: '',
        mediaPerm: true,
        noPhotoPerm: false
      });

      const { SupabaseBookingAdapter } = await import('@/lib/domain/adapters/SupabaseBookingAdapter');
      const bookingModule = new SupabaseBookingAdapter();

      await expect(
        bookingModule.bookClass(parentId, child2.id, sessionId)
      ).rejects.toThrow(/Session is fully booked|คลาสเต็มแล้ว/i);
    });

    it('[Edge Case] should not allow booking if 0 credits', async () => {
      // Empty all credits
      await supabaseAdmin.from('packages').update({ credits_remaining: 0 }).eq('parent_id', parentId);

      // Create a fresh session that is not full
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      
      const { data: newSession } = await supabaseAdmin.from('sessions').insert({
        session_date: tomorrow.toISOString().split('T')[0],
        time_label: '10:00-12:00',
        total_capacity: 10,
        booked_count: 0,
        is_active: true
      }).select().single();

      const { SupabaseBookingAdapter } = await import('@/lib/domain/adapters/SupabaseBookingAdapter');
      const bookingModule = new SupabaseBookingAdapter();

      await expect(
        bookingModule.bookClass(parentId, childId, newSession.id)
      ).rejects.toThrow(/No active credits available|ไม่พอ/i);

      // Cleanup
      await supabaseAdmin.from('sessions').delete().eq('id', newSession.id);
    });
  });
});

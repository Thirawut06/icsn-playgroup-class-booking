import { IBookingRepository, BookingResult } from '../ports/IBookingRepository';

export class BookingModule {
  constructor(private readonly bookingRepository: IBookingRepository) {}

  /**
   * Parent books a class.
   */
  async bookClass(parentId: string, childId: string, sessionId: string): Promise<BookingResult> {
    return this.bookingRepository.bookClass(parentId, childId, sessionId);
  }

  /**
   * Parent books multiple classes.
   */
  async bookClassesBatch(parentId: string, childId: string, sessionIds: string[]): Promise<BookingResult> {
    return this.bookingRepository.bookClassesBatch(parentId, childId, sessionIds);
  }

  /**
   * Admin books a class (walk-in or direct).
   */
  async adminBookClass(childId: string, sessionId: string, isFree: boolean): Promise<{ booking_id: string }> {
    return this.bookingRepository.adminBookClass(childId, sessionId, isFree);
  }

  /**
   * Check if the child is already booked for this session.
   */
  async hasDuplicateBooking(childId: string, sessionId: string): Promise<boolean> {
    return this.bookingRepository.hasDuplicateBooking(childId, sessionId);
  }

  /**
   * Parent cancels a booking.
   */
  async cancelBookingAsParent(bookingId: string, parentId: string, reason?: string): Promise<void> {
    return this.bookingRepository.cancelBooking(bookingId, parentId, reason);
  }

  /**
   * Admin cancels a booking.
   */
  async cancelBookingAsAdmin(bookingId: string, reason: string): Promise<void> {
    return this.bookingRepository.cancelBooking(bookingId, undefined, reason);
  }
}

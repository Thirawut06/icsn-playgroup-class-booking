export interface BookingResult {
  success: boolean;
  error?: string;
  booking_id?: string;
}

export interface IBookingRepository {
  /**
   * Check if a child is already booked for a specific session.
   */
  hasDuplicateBooking(childId: string, sessionId: string): Promise<boolean>;

  /**
   * Book a class using the transactional RPC (Parent).
   */
  bookClass(parentId: string, childId: string, sessionId: string): Promise<BookingResult>;

  /**
   * Book a class as Admin (walkin or direct).
   */
  adminBookClass(childId: string, sessionId: string, isFree: boolean): Promise<{ booking_id: string }>;

  /**
   * Cancel a booking (Parent or Admin).
   */
  cancelBooking(bookingId: string, parentId?: string, cancelReason?: string): Promise<void>;
}

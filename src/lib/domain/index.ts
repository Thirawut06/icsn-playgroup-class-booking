import { SupabaseSessionAdapter } from './adapters/SupabaseSessionAdapter';
import { SupabaseBookingAdapter } from './adapters/SupabaseBookingAdapter';
import { SessionModule } from './modules/SessionModule';
import { BookingModule } from './modules/BookingModule';

// Dependency Injection wiring
export const sessionAdapter = new SupabaseSessionAdapter();
export const bookingAdapter = new SupabaseBookingAdapter();

export const sessionModule = new SessionModule(sessionAdapter);
export const bookingModule = new BookingModule(bookingAdapter);

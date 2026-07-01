import { SupabaseSessionAdapter } from './adapters/SupabaseSessionAdapter';
import { SupabaseBookingAdapter } from './adapters/SupabaseBookingAdapter';
import { SupabaseSignatureAdapter } from './adapters/SupabaseSignatureAdapter';
import { SessionModule } from './modules/SessionModule';
import { BookingModule } from './modules/BookingModule';

// Dependency Injection wiring
export const sessionAdapter = new SupabaseSessionAdapter();
export const bookingAdapter = new SupabaseBookingAdapter();
export const signatureAdapter = new SupabaseSignatureAdapter();

export const sessionModule = new SessionModule(sessionAdapter);
export const bookingModule = new BookingModule(bookingAdapter);
// signatureAdapter is used directly (no extra module wrapper needed)
export const signatureModule = signatureAdapter;

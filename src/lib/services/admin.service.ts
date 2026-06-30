import { AdminUserService } from './admin-user.service';
import { AdminSessionService } from './admin-session.service';
import { AdminBookingService } from './admin-booking.service';

export const AdminService = {
  ...AdminUserService,
  ...AdminSessionService,
  ...AdminBookingService
};

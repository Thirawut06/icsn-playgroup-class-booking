import { supabase } from '../../supabase';
import { ISignatureRepository } from '../ports/ISignatureRepository';
import { AppError } from '../../utils';

export class SupabaseSignatureAdapter implements ISignatureRepository {
  async uploadSignature(bookingId: string, blob: Blob): Promise<string> {
    const filePath = `${bookingId}.png`;

    const { error: uploadError } = await supabase.storage
      .from('signatures')
      .upload(filePath, blob, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      throw new AppError(uploadError.message || 'Failed to upload signature', uploadError.name);
    }

    // Return a signed URL valid for 10 years (for archival purposes)
    const { data, error: urlError } = await supabase.storage
      .from('signatures')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10);

    if (urlError || !data?.signedUrl) {
      throw new AppError(urlError?.message || 'Failed to create signed URL', urlError?.name);
    }

    return data.signedUrl;
  }

  async saveCheckinSignature(bookingId: string, signatureUrl: string): Promise<void> {
    const { error } = await supabase.rpc('admin_save_checkin_signature', {
      p_booking_id: bookingId,
      p_signature_url: signatureUrl,
    });

    if (error) {
      throw new AppError(error.message || 'Failed to save check-in signature', error.code, error);
    }
  }
}

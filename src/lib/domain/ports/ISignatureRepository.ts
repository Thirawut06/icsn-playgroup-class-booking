export interface ISignatureRepository {
  /** Uploads a signature Blob to storage and returns the public/signed URL */
  uploadSignature(bookingId: string, blob: Blob): Promise<string>;
  /** Updates the booking record with the signature URL and checkin timestamp */
  saveCheckinSignature(bookingId: string, signatureUrl: string): Promise<void>;
}

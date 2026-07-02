import { google } from 'googleapis';
import { Readable } from 'stream';

export class GoogleWorkspaceService {
  private static getAuthClient() {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
      throw new Error('Google credentials not found in environment variables.');
    }

    return new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets'
      ],
    });
  }

  /**
   * Google Drive: Get or Create Folder
   */
  static async getOrCreateFolder(folderName: string, parentFolderId?: string): Promise<string> {
    const auth = this.getAuthClient();
    const drive = google.drive({ version: 'v3', auth });

    // Search for existing folder
    let q = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    if (parentFolderId) {
      q += ` and '${parentFolderId}' in parents`;
    }

    const searchRes = await drive.files.list({
      q,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      return searchRes.data.files[0].id!;
    }

    // Create new folder
    const fileMetadata: { name: string; mimeType: string; parents?: string[] } = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    const createRes = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    return createRes.data.id!;
  }

  /**
   * Google Drive: Upload File to Folder
   */
  static async uploadFileToDrive(fileName: string, mimeType: string, fileBuffer: Buffer, folderId: string): Promise<string> {
    const auth = this.getAuthClient();
    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };
    
    const media = {
      mimeType,
      body: Readable.from(fileBuffer),
    };

    const res = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    return res.data.webViewLink!;
  }

  /**
   * Google Sheets: Sync Data (Overwrite Sheet)
   */
  static async syncDataToSheet(spreadsheetId: string, range: string, dataRows: Array<Array<string | number | boolean | null>>): Promise<void> {
    const auth = this.getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Clear existing data first
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range,
    });

    // Write new data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: dataRows,
      },
    });
  }
}

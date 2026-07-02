import { NextResponse } from 'next/server';
import { GoogleWorkspaceService } from '@/lib/services/google-workspace.service';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/auth/roles';

export async function POST(request: Request) {
  try {
    const { parentId, childId, fileUrl, fileName } = await request.json();

    if (!parentId || !fileUrl || !fileName) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_ID;
    if (!rootFolderId) {
      return NextResponse.json({ error: 'GOOGLE_DRIVE_ROOT_ID is not configured' }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.id !== parentId && !isAdminUser(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch parent name
    const { data: parentData, error: parentError } = await supabase
      .from('parents')
      .select('name')
      .eq('id', parentId)
      .single();
      
    if (parentError || !parentData) {
      throw new Error('Parent not found');
    }
    const parentName = parentData.name;

    // Fetch child name if childId provided
    let childName = null;
    if (childId) {
      const { data: childData } = await supabase
        .from('children')
        .select('nickname')
        .eq('id', childId)
        .single();
      if (childData) {
        childName = childData.nickname;
      }
    }

    // 1. Fetch file from Supabase Public URL
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) throw new Error(`Failed to fetch file from Supabase: ${fileRes.statusText}`);
    
    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = fileRes.headers.get('content-type') || 'application/octet-stream';

    // 2. Get or create Parent Folder
    const parentFolderId = await GoogleWorkspaceService.getOrCreateFolder(parentName, rootFolderId);
    
    // 3. Get or create Child Folder (if applicable)
    let targetFolderId = parentFolderId;
    if (childName) {
      targetFolderId = await GoogleWorkspaceService.getOrCreateFolder(childName, parentFolderId);
    }

    // 4. Upload to Drive
    const driveLink = await GoogleWorkspaceService.uploadFileToDrive(fileName, mimeType, buffer, targetFolderId);

    return NextResponse.json({ success: true, driveLink });
  } catch (error: unknown) {
    console.error('Google Drive Upload Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

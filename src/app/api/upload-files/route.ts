import { NextRequest, NextResponse } from 'next/server';
import { uploadFilesToDrive } from '@/lib/google-drive';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const leadId = formData.get('leadId') as string;
    const files = formData.getAll('files') as File[];

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID es requerido' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: true, uploadedFiles: [], errors: [] },
        { status: 200 }
      );
    }

    const result = await uploadFilesToDrive(files, leadId);

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(
        { error: 'Error al subir archivos', details: result.errors },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en API upload-files:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


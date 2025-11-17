'use server';

import { google } from 'googleapis';
import { Readable } from 'stream';

// Configuración de Google Drive
// Estas variables deben estar en tu archivo .env.local
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

interface UploadFileResult {
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}

/**
 * Obtiene el cliente autenticado de Google Drive
 */
function getDriveClient() {
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error('Las credenciales de Google Drive no están configuradas');
  }

  const auth = new google.auth.JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * Crea una carpeta en Google Drive si no existe
 */
export async function createFolderIfNotExists(folderName: string): Promise<string> {
  try {
    const drive = getDriveClient();
    
    // Construir la query de búsqueda
    let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (GOOGLE_DRIVE_FOLDER_ID) {
      query += ` and '${GOOGLE_DRIVE_FOLDER_ID}' in parents`;
    }
    
    // Buscar si la carpeta ya existe
    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id!;
    }

    // Crear la carpeta si no existe
    const folderResponse = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        ...(GOOGLE_DRIVE_FOLDER_ID && { parents: [GOOGLE_DRIVE_FOLDER_ID] }),
      },
      fields: 'id',
    });

    return folderResponse.data.id!;
  } catch (error) {
    console.error('Error creando carpeta en Google Drive:', error);
    throw error;
  }
}

/**
 * Sube un archivo a Google Drive
 */
export async function uploadFileToDrive(
  file: File,
  folderId: string,
  leadId: string
): Promise<UploadFileResult> {
  try {
    const drive = getDriveClient();
    
    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);

    // Subir el archivo
    const fileMetadata = {
      name: `${leadId}_${file.name}`,
      parents: [folderId],
    };

    const media = {
      mimeType: file.type,
      body: stream,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
    });

    return {
      success: true,
      fileId: response.data.id!,
      webViewLink: response.data.webViewLink || undefined,
    };
  } catch (error) {
    console.error('Error subiendo archivo a Google Drive:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al subir archivo',
    };
  }
}

/**
 * Sube múltiples archivos a Google Drive dentro de una carpeta específica para un lead
 */
export async function uploadFilesToDrive(
  files: File[],
  leadId: string
): Promise<{ success: boolean; uploadedFiles: Array<{ name: string; url: string }>; errors: string[] }> {
  try {
    if (!files || files.length === 0) {
      return { success: true, uploadedFiles: [], errors: [] };
    }

    // Crear o obtener la carpeta para este lead
    const folderName = `Lead_${leadId}`;
    const folderId = await createFolderIfNotExists(folderName);

    const uploadedFiles: Array<{ name: string; url: string }> = [];
    const errors: string[] = [];

    // Subir cada archivo
    for (const file of files) {
      const result = await uploadFileToDrive(file, folderId, leadId);
      
      if (result.success && result.webViewLink) {
        uploadedFiles.push({
          name: file.name,
          url: result.webViewLink,
        });
      } else {
        errors.push(`Error al subir ${file.name}: ${result.error || 'Error desconocido'}`);
      }
    }

    return {
      success: errors.length === 0,
      uploadedFiles,
      errors,
    };
  } catch (error) {
    console.error('Error en uploadFilesToDrive:', error);
    return {
      success: false,
      uploadedFiles: [],
      errors: [error instanceof Error ? error.message : 'Error desconocido'],
    };
  }
}


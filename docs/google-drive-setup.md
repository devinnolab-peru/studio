# Configuración de Google Drive para Subida de Archivos

## Requisitos Previos

1. Instalar la dependencia:
```bash
npm install googleapis
```

## Configuración de Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google Drive:
   - Ve a "APIs & Services" > "Library"
   - Busca "Google Drive API"
   - Haz clic en "Enable"
4. Crea una cuenta de servicio:
   - Ve a "APIs & Services" > "Credentials"
   - Haz clic en "Create Credentials" > "Service Account"
   - Completa el formulario y crea la cuenta
5. Descarga el archivo JSON de credenciales
6. Crea las claves:
   - En la cuenta de servicio, ve a "Keys"
   - Haz clic en "Add Key" > "Create new key"
   - Selecciona JSON y descarga el archivo

## Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
GOOGLE_CLIENT_EMAIL=tu-email@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTu clave privada aquí\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=opcional-id-de-carpeta-padre-en-drive
```

### Cómo obtener los valores:

1. **GOOGLE_CLIENT_EMAIL**: Está en el archivo JSON descargado como `client_email`
2. **GOOGLE_PRIVATE_KEY**: Está en el archivo JSON como `private_key`. Copia todo el valor incluyendo los saltos de línea `\n`
3. **GOOGLE_DRIVE_FOLDER_ID** (opcional): Si quieres que los archivos se suban a una carpeta específica, comparte esa carpeta con el email de la cuenta de servicio y obtén el ID de la carpeta desde la URL de Google Drive

## Permisos de la Carpeta en Google Drive

Si usas `GOOGLE_DRIVE_FOLDER_ID`, asegúrate de:
1. Compartir la carpeta con el email de la cuenta de servicio
2. Dar permisos de "Editor" a la cuenta de servicio

## Funcionamiento

- Los archivos se suben a una carpeta llamada `Lead_{leadId}` en Google Drive
- Si no se especifica `GOOGLE_DRIVE_FOLDER_ID`, las carpetas se crearán en la raíz de Google Drive de la cuenta de servicio
- Cada lead tiene su propia carpeta con todos sus archivos adjuntos


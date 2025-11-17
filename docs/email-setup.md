# Configuración de Notificaciones por Email

## Configuración SMTP

Para que las notificaciones por email funcionen cuando se completa un formulario de requerimientos, necesitas configurar las credenciales SMTP en tu archivo `.env.local`.

### Opción 1: Gmail (Recomendado para desarrollo)

1. Ve a tu cuenta de Google
2. Activa la verificación en 2 pasos
3. Ve a [Contraseñas de aplicaciones](https://myaccount.google.com/apppasswords)
4. Genera una nueva contraseña de aplicación para "Correo"
5. Copia la contraseña generada

Agrega estas variables a tu `.env.local`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-contraseña-de-aplicacion-generada
NOTIFICATION_EMAIL=devinnolab@gmail.com
```

### Opción 2: Otro proveedor SMTP

Para otros proveedores (Outlook, SendGrid, Mailgun, etc.), ajusta las variables según corresponda:

```env
SMTP_HOST=smtp.tu-proveedor.com
SMTP_PORT=587
SMTP_USER=tu-usuario
SMTP_PASSWORD=tu-contraseña
NOTIFICATION_EMAIL=devinnolab@gmail.com
```

### Ejemplos por proveedor:

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=tu-api-key-de-sendgrid
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=tu-usuario-mailgun
SMTP_PASSWORD=tu-contraseña-mailgun
```

## Funcionamiento

Cuando un usuario completa el formulario de requerimientos en `/leads/[leadId]/form`, automáticamente se enviará un email a `devinnolab@gmail.com` con:

- Información de contacto del cliente
- Detalles del proyecto
- Alcance y funcionalidades seleccionadas
- Diseño y UX
- Contenido y estrategia
- Enlaces a archivos adjuntos (si los hay)

El email se envía en formato HTML con toda la información organizada.

## Nota Importante

Si las credenciales SMTP no están configuradas, el sistema continuará funcionando normalmente pero no se enviará el email. Los errores se registrarán en la consola del servidor pero no afectarán el proceso de guardado del formulario.


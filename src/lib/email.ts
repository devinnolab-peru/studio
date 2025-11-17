'use server';

import nodemailer from 'nodemailer';
import type { ClientRequirements } from './definitions';

// Configuración del transporter de email
// Estas variables deben estar en tu archivo .env.local
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'devinnolab@gmail.com';

/**
 * Crea el transporter de nodemailer
 */
function createTransporter() {
  if (!SMTP_USER || !SMTP_PASSWORD) {
    throw new Error('Las credenciales SMTP no están configuradas');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true para 465, false para otros puertos
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
}

/**
 * Formatea los datos del formulario para el email
 */
function formatFormDataForEmail(formData: ClientRequirements): string {
  const clientType = formData.contactInfo.clientType === 'empresa' ? 'Empresa' : 'Particular';
  
  let html = `
    <h2>Nuevo Formulario de Requerimientos Enviado</h2>
    
    <h3>Información de Contacto</h3>
    <ul>
      <li><strong>Tipo de Cliente:</strong> ${clientType}</li>
      <li><strong>Nombre:</strong> ${formData.contactInfo.name}</li>
      ${formData.contactInfo.company ? `<li><strong>Empresa:</strong> ${formData.contactInfo.company}</li>` : ''}
      <li><strong>Email:</strong> ${formData.contactInfo.email}</li>
      <li><strong>Teléfono:</strong> ${formData.contactInfo.phone || 'No especificado'}</li>
    </ul>
    
    <h3>Sobre el Proyecto</h3>
    <ul>
      <li><strong>Nombre del Proyecto:</strong> ${formData.projectInfo.projectName}</li>
      <li><strong>Idea/Problema:</strong> ${formData.projectInfo.projectIdea}</li>
      <li><strong>Público Objetivo:</strong> ${formData.projectInfo.targetAudience || 'No especificado'}</li>
      <li><strong>Objetivos Principales:</strong>
        <ul>
          ${formData.projectInfo.mainGoals.filter(g => g).map(goal => `<li>${goal}</li>`).join('')}
        </ul>
      </li>
      <li><strong>Competidores:</strong> ${formData.projectInfo.competitors || 'No especificado'}</li>
      <li><strong>País:</strong> ${formData.projectInfo.country || 'No especificado'}</li>
    </ul>
    
    <h3>Alcance y Funcionalidades</h3>
    <ul>
      ${formData.scopeAndFeatures.platforms.length > 0 ? `<li><strong>Plataformas:</strong> ${formData.scopeAndFeatures.platforms.join(', ')}</li>` : ''}
      <li><strong>Funcionalidades Seleccionadas:</strong>
        <ul>
          ${formData.scopeAndFeatures.commonFeatures.map(feature => `<li>${feature}</li>`).join('')}
        </ul>
      </li>
      ${formData.scopeAndFeatures.otherFeatures.length > 0 ? `
        <li><strong>Otras Funcionalidades:</strong>
          <ul>
            ${formData.scopeAndFeatures.otherFeatures.map(feature => `<li>${feature}</li>`).join('')}
          </ul>
        </li>
      ` : ''}
    </ul>
    
    <h3>Diseño y Experiencia de Usuario</h3>
    <ul>
      <li><strong>Identidad de Marca:</strong> ${formData.designAndUX.hasBrandIdentity === 'yes' ? 'Sí' : 'No'}</li>
      ${formData.designAndUX.designInspirations.filter(i => i).length > 0 ? `
        <li><strong>Inspiraciones:</strong>
          <ul>
            ${formData.designAndUX.designInspirations.filter(i => i).map(insp => `<li>${insp}</li>`).join('')}
          </ul>
        </li>
      ` : ''}
      <li><strong>Estilo Visual:</strong> ${formData.designAndUX.lookAndFeel || 'No especificado'}</li>
    </ul>
    
    <h3>Contenido y Estrategia</h3>
    <ul>
      <li><strong>Plan de Marketing:</strong> ${formData.contentAndStrategy.marketingPlan || 'No especificado'}</li>
      <li><strong>Mantenimiento:</strong> ${formData.contentAndStrategy.maintenance || 'No especificado'}</li>
    </ul>
    
    ${formData.attachments && formData.attachments.length > 0 ? `
      <h3>Archivos Adjuntos</h3>
      <ul>
        ${formData.attachments.map(file => `<li><a href="${file.url}">${file.name}</a></li>`).join('')}
      </ul>
    ` : ''}
    
    <hr>
    <p><small>Este email fue generado automáticamente cuando se completó el formulario de requerimientos.</small></p>
  `;
  
  return html;
}

/**
 * Formatea el email de confirmación para el cliente
 */
function formatConfirmationEmailForClient(formData: ClientRequirements): string {
  const clientName = formData.contactInfo.name;
  const projectName = formData.projectInfo.projectName || 'tu proyecto';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>¡Gracias por contactarnos!</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${clientName}</strong>,</p>
          
          <p>Hemos recibido correctamente tu información sobre el proyecto <strong>"${projectName}"</strong>.</p>
          
          <p>Nuestro equipo revisará tu solicitud y nos pondremos en contacto contigo pronto para discutir los próximos pasos.</p>
          
          <h3>Resumen de tu solicitud:</h3>
          <ul>
            <li><strong>Proyecto:</strong> ${projectName}</li>
            <li><strong>Email de contacto:</strong> ${formData.contactInfo.email}</li>
            <li><strong>Teléfono:</strong> ${formData.contactInfo.phone || 'No especificado'}</li>
          </ul>
          
          <p>Si tienes alguna pregunta o necesitas hacer algún cambio en tu solicitud, no dudes en contactarnos.</p>
          
          <p>¡Esperamos trabajar contigo!</p>
          
          <p>Saludos,<br>
          <strong>El equipo de ProPlanner</strong></p>
        </div>
        <div class="footer">
          <p>Este es un email automático de confirmación. Por favor, no respondas a este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return html;
}

/**
 * Envía un email de confirmación al cliente
 */
export async function sendClientConfirmationEmail(formData: ClientRequirements): Promise<{ success: boolean; error?: string }> {
  try {
    if (!SMTP_USER || !SMTP_PASSWORD) {
      console.warn('Las credenciales SMTP no están configuradas. El email no se enviará.');
      return { success: false, error: 'Configuración SMTP no disponible' };
    }

    if (!formData.contactInfo.email) {
      return { success: false, error: 'Email del cliente no disponible' };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"ProPlanner" <${SMTP_USER}>`,
      to: formData.contactInfo.email,
      subject: `Confirmación de Recepción - ${formData.projectInfo.projectName || 'Tu Proyecto'}`,
      html: formatConfirmationEmailForClient(formData),
    };

    await transporter.sendMail(mailOptions);
    
    return { success: true };
  } catch (error) {
    console.error('Error enviando email de confirmación al cliente:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al enviar email' 
    };
  }
}

/**
 * Envía un email de notificación cuando se completa un formulario de requerimientos
 */
export async function sendLeadFormNotification(formData: ClientRequirements, leadId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!SMTP_USER || !SMTP_PASSWORD) {
      console.warn('Las credenciales SMTP no están configuradas. El email no se enviará.');
      return { success: false, error: 'Configuración SMTP no disponible' };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"ProPlanner" <${SMTP_USER}>`,
      to: NOTIFICATION_EMAIL,
      subject: `Nuevo Formulario de Requerimientos - ${formData.projectInfo.projectName || 'Sin nombre'}`,
      html: formatFormDataForEmail(formData),
    };

    await transporter.sendMail(mailOptions);
    
    return { success: true };
  } catch (error) {
    console.error('Error enviando email de notificación:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al enviar email' 
    };
  }
}


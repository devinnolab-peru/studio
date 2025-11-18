
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FolderKanban, Send, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { submitLeadForm } from '@/lib/actions';

interface ProjectRequirementsFormProps {
    leadId: string;
    projectType: string;
    onBack: () => void;
    onSubmitSuccess: () => void;
}

const COMMON_FEATURES: { [key: string]: string[] } = {
    web: [
        "Blog",
        "Galería de Imágenes",
        "Formulario de Contacto Avanzado",
        "Mapa Interactivo",
        "Sistema de Búsqueda",
        "Multidioma (i18n)",
        "SEO Optimizado",
        "Integración con Redes Sociales",
        "Newsletter/Suscripciones",
        "Chat en Vivo",
        "Sistema de Comentarios",
        "Calendario de Eventos",
        "Portafolio de Trabajos",
        "Testimonios/Reseñas",
        "Sistema de Reservas/Citas"
    ],
    movil: [
        "Notificaciones Push",
        "Geolocalización",
        "Acceso a Cámara/Galería",
        "Login con Biometría",
        "Modo Offline",
        "Sincronización en la Nube",
        "Escaneo de Códigos QR",
        "Pagos Móviles",
        "Chat/Mensajería",
        "Reproductor de Audio/Video",
        "Mapas y Navegación",
        "Reconocimiento de Voz",
        "Realidad Aumentada (AR)",
        "Compartir en Redes Sociales",
        "Widgets para Pantalla de Inicio"
    ],
    software: [
        "Dashboard de Analíticas",
        "Gestión de Roles y Permisos",
        "Importación/Exportación de Datos",
        "Integración con APIs de Terceros",
        "Sistema de Autenticación (2FA)",
        "Auditoría y Logs",
        "Backup Automático",
        "Búsqueda Avanzada/Filtros",
        "Exportación de Reportes (PDF/Excel)",
        "Sistema de Notificaciones",
        "Gestión de Tareas/Proyectos",
        "Colaboración en Tiempo Real",
        "API REST/GraphQL",
        "Webhooks",
        "Integración con Email/SMS"
    ],
    ecommerce: [
        "Carrito de Compras",
        "Pasarelas de Pago (Stripe/PayPal)",
        "Gestión de Inventario",
        "Sistema de Reseñas de Productos",
        "Cupones de Descuento",
        "Wishlist/Lista de Deseos",
        "Comparador de Productos",
        "Búsqueda Avanzada",
        "Filtros por Categoría/Precio",
        "Sistema de Envíos",
        "Tracking de Pedidos",
        "Programa de Fidelización",
        "Productos Relacionados",
        "Carrito Abandonado",
        "Integración con Marketplaces"
    ],
    otro: [
        "Login de Usuarios",
        "Pagos en línea",
        "Panel de Administración",
        "Notificaciones por email",
        "Integración con API externa",
        "Reportes y Analíticas",
        "Gestión de Contenido (CMS)",
        "Sistema de Archivos",
        "Chatbot/Asistente Virtual",
        "Calendario y Agendamiento",
        "Videollamadas/Reuniones",
        "Sistema de Facturación",
        "Gestión de Clientes (CRM)",
        "Base de Conocimientos/FAQ",
        "Sistema de Tickets/Soporte"
    ],
};

const PLATFORMS = ["Aplicación Web", "Aplicación iOS", "Aplicación Android", "Otro"];

export default function ProjectRequirementsForm({ leadId, projectType, onBack, onSubmitSuccess }: ProjectRequirementsFormProps) {
    const { toast } = useToast();
    
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        contactInfo: { name: '', company: '', email: '', phone: '', clientType: 'particular' as 'empresa' | 'particular' },
        projectInfo: { projectName: '', projectIdea: '', targetAudience: '', mainGoals: ['', '', ''], competitors: '', country: '' },
        scopeAndFeatures: { platforms: [] as string[], commonFeatures: [] as string[], otherFeatures: [] as string[] },
        designAndUX: { hasBrandIdentity: 'no', brandFiles: [], designInspirations: ['', ''], lookAndFeel: '' },
        contentAndStrategy: { contentCreation: '', marketingPlan: '', maintenance: '' },
        attachments: [] as File[],
    });
    
    const [otherFeatureInput, setOtherFeatureInput] = useState('');
    
    const relevantFeatures = COMMON_FEATURES[projectType] || COMMON_FEATURES['otro'];

    const handleChange = (section: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                // @ts-ignore
                ...prev[section],
                [field]: value,
            },
        }));
    };

    const handleGoalChange = (index: number, value: string) => {
        const newGoals = [...formData.projectInfo.mainGoals];
        newGoals[index] = value;
        handleChange('projectInfo', 'mainGoals', newGoals);
    };
    
    const handlePlatformChange = (platform: string) => {
        const currentPlatforms = formData.scopeAndFeatures.platforms;
        const newPlatforms = currentPlatforms.includes(platform)
            ? currentPlatforms.filter(p => p !== platform)
            : [...currentPlatforms, platform];
        handleChange('scopeAndFeatures', 'platforms', newPlatforms);
    }

    const handleFeatureChange = (feature: string) => {
        const currentFeatures = formData.scopeAndFeatures.commonFeatures;
        const newFeatures = currentFeatures.includes(feature)
            ? currentFeatures.filter(f => f !== feature)
            : [...currentFeatures, feature];
        handleChange('scopeAndFeatures', 'commonFeatures', newFeatures);
    }
    
    const handleAddOtherFeature = () => {
        if (otherFeatureInput.trim() !== '') {
            const newOtherFeatures = [...formData.scopeAndFeatures.otherFeatures, otherFeatureInput.trim()];
            handleChange('scopeAndFeatures', 'otherFeatures', newOtherFeatures);
            setOtherFeatureInput('');
        }
    };

    const handleRemoveOtherFeature = (index: number) => {
        const newOtherFeatures = formData.scopeAndFeatures.otherFeatures.filter((_, i) => i !== index);
        handleChange('scopeAndFeatures', 'otherFeatures', newOtherFeatures);
    };

    const handleInspirationChange = (index: number, value: string) => {
        const newInspirations = [...formData.designAndUX.designInspirations];
        newInspirations[index] = value;
        handleChange('designAndUX', 'designInspirations', newInspirations);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setFormData(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...files],
        }));
    };

    const handleRemoveFile = (index: number) => {
        setFormData(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            // Subir archivos a Google Drive si hay archivos
            let uploadedFilesData: Array<{ name: string; url: string }> = [];
            
            if (formData.attachments.length > 0) {
                const uploadFormData = new FormData();
                uploadFormData.append('leadId', leadId);
                formData.attachments.forEach((file) => {
                    uploadFormData.append('files', file);
                });

                const uploadResponse = await fetch('/api/upload-files', {
                    method: 'POST',
                    body: uploadFormData,
                });

                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    uploadedFilesData = uploadResult.uploadedFiles || [];
                    
                    if (uploadResult.errors && uploadResult.errors.length > 0) {
                        toast({
                            variant: 'destructive',
                            title: "Advertencia",
                            description: `Algunos archivos no se pudieron subir: ${uploadResult.errors.join(', ')}`,
                        });
                    }
                } else {
                    toast({
                        variant: 'destructive',
                        title: "Error",
                        description: "No se pudieron subir los archivos. El formulario se enviará sin los archivos.",
                    });
                }
            }

            // Enviar el formulario con la información de archivos subidos
            const formDataToSubmit = {
                ...formData,
                attachments: uploadedFilesData,
            };
            
            const result = await submitLeadForm(leadId, formDataToSubmit);
            
            if (result.success) {
                toast({
                    title: "Requerimientos Enviados",
                    description: "Gracias por completar el formulario. Nos pondremos en contacto contigo pronto.",
                });
                // Llamar a onSubmitSuccess de forma asíncrona para evitar recargas
                setTimeout(() => {
                    onSubmitSuccess();
                }, 0);
            } else {
                toast({
                    variant: 'destructive',
                    title: "Error",
                    description: result.error || "No se pudo enviar el formulario.",
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Error",
                description: "Ocurrió un error al enviar el formulario.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev > 1 ? prev - 1 : 1);

    const totalSteps = 5;


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-3xl">
         <div className="mb-4">
            <Button variant="outline" onClick={onBack}>Volver a seleccionar tipo</Button>
        </div>
        <div className="mb-8 flex flex-col items-center text-center">
            <FolderKanban className="mb-4 h-12 w-12 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Cuéntanos sobre tu Proyecto</h1>
            <p className="text-muted-foreground">
                Estás en el paso {currentStep} de {totalSteps}. Completa este formulario para que podamos entender tu visión.
            </p>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }}>
            <Card>
                {currentStep === 1 && (
                    <>
                        <CardHeader>
                            <CardTitle>Información de Contacto</CardTitle>
                            <CardDescription>Empecemos con lo básico. ¿Quién eres?</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>¿Eres una empresa o particular?</Label>
                                <RadioGroup 
                                    value={formData.contactInfo.clientType} 
                                    onValueChange={(value: 'empresa' | 'particular') => handleChange('contactInfo', 'clientType', value)}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="particular" id="client-particular" />
                                        <Label htmlFor="client-particular">Particular</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="empresa" id="client-empresa" />
                                        <Label htmlFor="client-empresa">Empresa</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre Completo</Label>
                                    <Input id="name" value={formData.contactInfo.name} onChange={e => handleChange('contactInfo', 'name', e.target.value)} required />
                                </div>
                                {formData.contactInfo.clientType === 'empresa' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="company">Empresa</Label>
                                        <Input id="company" value={formData.contactInfo.company} onChange={e => handleChange('contactInfo', 'company', e.target.value)} />
                                    </div>
                                )}
                            </div>
                             <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Correo Electrónico</Label>
                                    <Input id="email" type="email" value={formData.contactInfo.email} onChange={e => handleChange('contactInfo', 'email', e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Teléfono</Label>
                                    <Input id="phone" type="tel" value={formData.contactInfo.phone} onChange={e => handleChange('contactInfo', 'phone', e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end">
                            <Button onClick={nextStep}>Siguiente</Button>
                        </CardFooter>
                    </>
                )}
                {currentStep === 2 && (
                    <>
                        <CardHeader>
                            <CardTitle>Sobre tu Proyecto</CardTitle>
                            <CardDescription>Describe tu idea, tu público y tus metas.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="space-y-2">
                                <Label htmlFor="projectName">Nombre del Proyecto</Label>
                                <Input id="projectName" value={formData.projectInfo.projectName} onChange={e => handleChange('projectInfo', 'projectName', e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="projectIdea">Describe tu idea o el problema que buscas resolver</Label>
                                <Textarea id="projectIdea" rows={4} value={formData.projectInfo.projectIdea} onChange={e => handleChange('projectInfo', 'projectIdea', e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="targetAudience">¿Quién es tu público objetivo?</Label>
                                <Textarea id="targetAudience" rows={3} value={formData.projectInfo.targetAudience} onChange={e => handleChange('projectInfo', 'targetAudience', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>¿Cuáles son los 3 objetivos más importantes del proyecto?</Label>
                                <Input placeholder="Objetivo 1" value={formData.projectInfo.mainGoals[0]} onChange={e => handleGoalChange(0, e.target.value)} />
                                <Input placeholder="Objetivo 2" value={formData.projectInfo.mainGoals[1]} onChange={e => handleGoalChange(1, e.target.value)} />
                                <Input placeholder="Objetivo 3" value={formData.projectInfo.mainGoals[2]} onChange={e => handleGoalChange(2, e.target.value)} />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="competitors">¿Quiénes son tus competidores principales?</Label>
                                    <Input id="competitors" value={formData.projectInfo.competitors} onChange={e => handleChange('projectInfo', 'competitors', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country">País</Label>
                                    <Input id="country" value={formData.projectInfo.country} onChange={e => handleChange('projectInfo', 'country', e.target.value)} placeholder="Ej: Perú, México, España" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between">
                            <Button variant="outline" onClick={prevStep}>Anterior</Button>
                            <Button onClick={nextStep}>Siguiente</Button>
                        </CardFooter>
                    </>
                )}
                {currentStep === 3 && (
                     <>
                        <CardHeader>
                            <CardTitle>Alcance y Funcionalidades</CardTitle>
                            <CardDescription>¿Qué debería hacer tu aplicación y en qué plataformas?</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           {projectType === 'movil' && (
                                <div className="space-y-2">
                                    <Label>¿En qué plataformas necesitas la aplicación?</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {PLATFORMS.filter(p => p.includes('iOS') || p.includes('Android')).map(platform => (
                                            <div key={platform} className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id={`platform-${platform}`}
                                                    onCheckedChange={() => handlePlatformChange(platform)}
                                                    checked={formData.scopeAndFeatures.platforms.includes(platform)}
                                                />
                                                <label htmlFor={`platform-${platform}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                    {platform}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                           )}
                            <div className="space-y-2">
                                <Label>Selecciona las funcionalidades que apliquen a tu proyecto:</Label>
                                <div className="grid grid-cols-2 gap-2">
                                {relevantFeatures.map(feature => (
                                    <div key={feature} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={feature} 
                                            onCheckedChange={() => handleFeatureChange(feature)} 
                                            checked={formData.scopeAndFeatures.commonFeatures.includes(feature)}
                                        />
                                        <label htmlFor={feature} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {feature}
                                        </label>
                                    </div>
                                ))}
                                </div>
                            </div>
                             <div className="space-y-4">
                                <Label htmlFor="otherFeatures">Añade otras funcionalidades clave que no estén en la lista</Label>
                                <div className="flex items-center gap-2">
                                    <Input 
                                        id="otherFeatures"
                                        value={otherFeatureInput}
                                        onChange={(e) => setOtherFeatureInput(e.target.value)}
                                        placeholder="p. ej. Sincronización en tiempo real"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddOtherFeature();
                                            }
                                        }}
                                    />
                                    <Button type="button" onClick={handleAddOtherFeature}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Añadir
                                    </Button>
                                </div>
                                {formData.scopeAndFeatures.otherFeatures.length > 0 && (
                                    <ul className="mt-2 space-y-2">
                                        {formData.scopeAndFeatures.otherFeatures.map((feature, index) => (
                                            <li key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                                                <span className="text-sm">{feature}</span>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveOtherFeature(index)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between">
                            <Button variant="outline" onClick={prevStep}>Anterior</Button>
                            <Button onClick={nextStep}>Siguiente</Button>
                        </CardFooter>
                    </>
                )}
                 {currentStep === 4 && (
                     <>
                        <CardHeader>
                            <CardTitle>Diseño y Experiencia de Usuario</CardTitle>
                            <CardDescription>Hablemos de la apariencia y la sensación.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="space-y-2">
                                <Label>¿Ya tienes una identidad de marca (logo, colores)?</Label>
                                <RadioGroup 
                                    value={formData.designAndUX.hasBrandIdentity} 
                                    onValueChange={value => handleChange('designAndUX', 'hasBrandIdentity', value)}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="yes" id="brand-yes" />
                                        <Label htmlFor="brand-yes">Sí</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="no" id="brand-no" />
                                        <Label htmlFor="brand-no">No</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <div className="space-y-2">
                                <Label>Menciona 2 o 3 sitios web o apps cuyo diseño te guste</Label>
                                <Input placeholder="https://www.apple.com" value={formData.designAndUX.designInspirations[0]} onChange={e => handleInspirationChange(0, e.target.value)} />
                                <Input placeholder="https://stripe.com" value={formData.designAndUX.designInspirations[1]} onChange={e => handleInspirationChange(1, e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lookAndFeel">Describe el estilo visual que buscas (p. ej., Moderno, Minimalista, Corporativo)</Label>
                                <Textarea id="lookAndFeel" rows={3} value={formData.designAndUX.lookAndFeel} onChange={e => handleChange('designAndUX', 'lookAndFeel', e.target.value)} />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between">
                            <Button variant="outline" onClick={prevStep}>Anterior</Button>
                            <Button onClick={nextStep}>Siguiente</Button>
                        </CardFooter>
                    </>
                )}
                 {currentStep === 5 && (
                    <>
                        <CardHeader>
                            <CardTitle>Contenido y Estrategia</CardTitle>
                            <CardDescription>Pensemos a futuro sobre el proyecto.</CardDescription>
                        </CardHeader>
                         <CardContent className="space-y-4">
                             <div className="space-y-2">
                                 <Label htmlFor="marketingPlan">¿Tienes algún plan de marketing para después del lanzamiento?</Label>
                                 <Textarea id="marketingPlan" rows={3} value={formData.contentAndStrategy.marketingPlan} onChange={e => handleChange('contentAndStrategy', 'marketingPlan', e.target.value)} />
                             </div>
                              <div className="space-y-2">
                                 <Label htmlFor="maintenance">¿Estás interesado en un plan de mantenimiento y soporte continuo?</Label>
                                 <Textarea id="maintenance" rows={3} value={formData.contentAndStrategy.maintenance} onChange={e => handleChange('contentAndStrategy', 'maintenance', e.target.value)} />
                             </div>
                         </CardContent>
                        <CardFooter className="justify-between">
                            <Button variant="outline" onClick={prevStep}>Anterior</Button>
                            <Button type="button" onClick={handleSubmit} disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Enviar Requerimientos
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </>
                )}
            </Card>
        </form>
      </div>
    </div>
  );
}

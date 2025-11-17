'use client';

import { useEffect, useState, useTransition, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser, toggleUserActive } from '@/lib/actions';
import type { User } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/shared/page-header';

type UserWithoutPassword = Omit<User, 'password'>;

export default function ConfiguracionPage() {
  const [users, setUsers] = useState<UserWithoutPassword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [createState, createDispatch] = useActionState(createUser, undefined);
  const [updateState, updateDispatch] = useActionState(updateUser, undefined);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (createState?.success) {
      toast({
        title: 'Usuario creado',
        description: 'El usuario ha sido creado exitosamente.',
      });
      setIsDialogOpen(false);
      loadUsers();
    } else if (createState?.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: createState.error,
      });
    }
  }, [createState, toast]);

  useEffect(() => {
    if (updateState?.success) {
      toast({
        title: 'Usuario actualizado',
        description: 'El usuario ha sido actualizado exitosamente.',
      });
      setIsDialogOpen(false);
      setEditingUser(null);
      loadUsers();
    } else if (updateState?.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: updateState.error,
      });
    }
  }, [updateState, toast]);
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
  };

  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los usuarios.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (user: UserWithoutPassword) => {
    setEditingUser(user as User);
    setIsDialogOpen(true);
  };

  const handleDelete = (userId: string) => {
    setUserToDelete(userId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    startTransition(async () => {
      const result = await deleteUser(userToDelete);
      if (result?.success) {
        toast({
          title: 'Usuario eliminado',
          description: 'El usuario ha sido eliminado exitosamente.',
        });
        loadUsers();
      } else if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      }
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    });
  };

  const handleToggleActive = async (userId: string) => {
    startTransition(async () => {
      const result = await toggleUserActive(userId);
      if (result?.success) {
        toast({
          title: 'Estado actualizado',
          description: 'El estado del usuario ha sido actualizado.',
        });
        loadUsers();
      } else if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Gestiona los usuarios del sistema"
      />
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuarios</CardTitle>
              <CardDescription>
                Administra los usuarios que pueden acceder al sistema
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile Cards View */}
          <div className="block sm:hidden space-y-4">
            {users.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay usuarios registrados
              </p>
            ) : (
              users.map((user) => (
                <Card key={user.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Creado: {new Date(user.createdAt).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <Badge variant={user.active ? 'default' : 'secondary'}>
                          {user.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`active-mobile-${user.id}`} className="text-sm">
                            {user.active ? 'Activo' : 'Inactivo'}
                          </Label>
                          <Switch
                            id={`active-mobile-${user.id}`}
                            checked={user.active}
                            onCheckedChange={() => handleToggleActive(user.id)}
                            disabled={isPending}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.id)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No hay usuarios registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.active ? 'default' : 'secondary'}>
                          {user.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`active-${user.id}`} className="text-sm">
                              {user.active ? 'Activo' : 'Inactivo'}
                            </Label>
                            <Switch
                              id={`active-${user.id}`}
                              checked={user.active}
                              onCheckedChange={() => handleToggleActive(user.id)}
                              disabled={isPending}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.id)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <UserDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        user={editingUser}
        onCreate={createDispatch}
        onUpdate={updateDispatch}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el usuario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UserDialog({
  isOpen,
  onClose,
  user,
  onCreate,
  onUpdate,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onCreate: (formData: FormData) => void;
  onUpdate: (formData: FormData) => void;
}) {
  const isEditing = !!user;
  const [isActive, setIsActive] = useState(user?.active ?? true);

  useEffect(() => {
    if (user) {
      setIsActive(user.active);
    } else {
      setIsActive(true);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('active', isActive ? 'true' : 'false');
    
    if (isEditing) {
      onUpdate(formData);
    } else {
      onCreate(formData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          <DialogDescription className="text-sm">
            {isEditing
              ? 'Modifica la información del usuario.'
              : 'Completa los datos para crear un nuevo usuario.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isEditing && (
            <input type="hidden" name="id" value={user.id} />
          )}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm sm:text-base">Nombre</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={user?.name || ''}
              className="text-sm sm:text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={user?.email || ''}
              className="text-sm sm:text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm sm:text-base">
              {isEditing ? 'Nueva Contraseña (dejar vacío para mantener la actual)' : 'Contraseña'}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required={!isEditing}
              minLength={6}
              className="text-sm sm:text-base"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="active" className="text-sm sm:text-base">Usuario activo</Label>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


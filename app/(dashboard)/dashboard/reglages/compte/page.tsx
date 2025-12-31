/**
 * Page de gestion du compte utilisateur
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  changePasswordSchema,
  changeEmailSchema,
  deleteAccountSchema,
  type ChangePasswordInput,
  type ChangeEmailInput,
  type DeleteAccountInput,
} from "@/lib/core/profile/validations"
import {
  changePassword,
  changeEmail,
  deleteAccount,
} from "@/lib/core/profile/actions"
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { IconLoader2, IconLock, IconMail, IconTrash, IconAlertTriangle } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'

export default function AccountPage() {
  const router = useRouter()
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const emailForm = useForm<ChangeEmailInput>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      newEmail: '',
      password: '',
    },
  })

  const deleteForm = useForm<DeleteAccountInput>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: '',
      confirmText: '' as 'SUPPRIMER',
    },
  })

  const onPasswordSubmit = async (data: ChangePasswordInput) => {
    setIsChangingPassword(true)
    try {
      const result = await changePassword(data)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.success) {
        toast.success(result.message)
        passwordForm.reset()
      }
    } catch (error) {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const onEmailSubmit = async (data: ChangeEmailInput) => {
    setIsChangingEmail(true)
    try {
      const result = await changeEmail(data)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.success) {
        toast.success(result.message)
        emailForm.reset()
      }
    } catch (error) {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsChangingEmail(false)
    }
  }

  const onDeleteSubmit = async (data: DeleteAccountInput) => {
    setIsDeleting(true)
    try {
      const result = await deleteAccount(data)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.success) {
        toast.success(result.message)
        if (result.redirect) {
          router.push(result.redirect)
        }
      }
    } catch (error) {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres du compte"
        description="Gérez les paramètres de sécurité et votre compte"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Réglages', href: '/dashboard/reglages' },
          { label: 'Compte' },
        ]}
      />

      {/* Changement de mot de passe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconLock className="h-5 w-5" />
            Mot de passe
          </CardTitle>
          <CardDescription>
            Changez votre mot de passe pour sécuriser votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="space-y-4"
          >
            {/* Mot de passe actuel */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                {...passwordForm.register('currentPassword')}
                aria-invalid={
                  passwordForm.formState.errors.currentPassword
                    ? 'true'
                    : 'false'
                }
                aria-describedby={
                  passwordForm.formState.errors.currentPassword
                    ? 'currentPassword-error'
                    : undefined
                }
              />
              {passwordForm.formState.errors.currentPassword && (
                <p
                  id="currentPassword-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            {/* Nouveau mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••••••"
                {...passwordForm.register('newPassword')}
                aria-invalid={
                  passwordForm.formState.errors.newPassword ? 'true' : 'false'
                }
                aria-describedby={
                  passwordForm.formState.errors.newPassword
                    ? 'newPassword-error'
                    : undefined
                }
              />
              {passwordForm.formState.errors.newPassword && (
                <p
                  id="newPassword-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Minimum 12 caractères avec majuscule, minuscule, chiffre et
                caractère spécial
              </p>
            </div>

            {/* Confirmation */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirmer le nouveau mot de passe
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••••••"
                {...passwordForm.register('confirmPassword')}
                aria-invalid={
                  passwordForm.formState.errors.confirmPassword
                    ? 'true'
                    : 'false'
                }
                aria-describedby={
                  passwordForm.formState.errors.confirmPassword
                    ? 'confirmPassword-error'
                    : undefined
                }
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Modification...
                </>
              ) : (
                'Changer le mot de passe'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Changement d'email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconMail className="h-5 w-5" />
            Adresse email
          </CardTitle>
          <CardDescription>
            Changez votre adresse email. Un email de confirmation sera envoyé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={emailForm.handleSubmit(onEmailSubmit)}
            className="space-y-4"
          >
            {/* Nouvel email */}
            <div className="space-y-2">
              <Label htmlFor="newEmail">Nouvelle adresse email</Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="nouveau@example.com"
                {...emailForm.register('newEmail')}
                aria-invalid={
                  emailForm.formState.errors.newEmail ? 'true' : 'false'
                }
                aria-describedby={
                  emailForm.formState.errors.newEmail
                    ? 'newEmail-error'
                    : undefined
                }
              />
              {emailForm.formState.errors.newEmail && (
                <p
                  id="newEmail-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {emailForm.formState.errors.newEmail.message}
                </p>
              )}
            </div>

            {/* Mot de passe pour confirmer */}
            <div className="space-y-2">
              <Label htmlFor="emailPassword">
                Mot de passe (pour confirmer)
              </Label>
              <Input
                id="emailPassword"
                type="password"
                placeholder="••••••••"
                {...emailForm.register('password')}
                aria-invalid={
                  emailForm.formState.errors.password ? 'true' : 'false'
                }
                aria-describedby={
                  emailForm.formState.errors.password
                    ? 'emailPassword-error'
                    : undefined
                }
              />
              {emailForm.formState.errors.password && (
                <p
                  id="emailPassword-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {emailForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isChangingEmail}>
              {isChangingEmail ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Modification...
                </>
              ) : (
                "Changer l'email"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Zone de danger */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <IconAlertTriangle className="h-5 w-5" />
            Zone de danger
          </CardTitle>
          <CardDescription>
            Actions irréversibles. Procédez avec prudence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <IconTrash className="mr-2 h-4 w-4" />
                Supprimer mon compte
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Supprimer votre compte</DialogTitle>
                <DialogDescription>
                  Cette action est irréversible. Toutes vos données seront
                  supprimées définitivement. Tapez &quot;SUPPRIMER&quot; pour
                  confirmer.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={deleteForm.handleSubmit(onDeleteSubmit)}
                className="space-y-4"
              >
                {/* Mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="deletePassword">Mot de passe</Label>
                  <Input
                    id="deletePassword"
                    type="password"
                    placeholder="••••••••"
                    {...deleteForm.register('password')}
                    aria-invalid={
                      deleteForm.formState.errors.password ? 'true' : 'false'
                    }
                  />
                  {deleteForm.formState.errors.password && (
                    <p className="text-sm text-destructive" role="alert">
                      {deleteForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirmation texte */}
                <div className="space-y-2">
                  <Label htmlFor="confirmText">
                    Tapez &quot;SUPPRIMER&quot; pour confirmer
                  </Label>
                  <Input
                    id="confirmText"
                    placeholder="SUPPRIMER"
                    {...deleteForm.register('confirmText')}
                    aria-invalid={
                      deleteForm.formState.errors.confirmText ? 'true' : 'false'
                    }
                  />
                  {deleteForm.formState.errors.confirmText && (
                    <p className="text-sm text-destructive" role="alert">
                      {deleteForm.formState.errors.confirmText.message}
                    </p>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDeleteDialogOpen(false)
                      deleteForm.reset()
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      'Supprimer définitivement'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}





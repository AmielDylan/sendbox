'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from '@/lib/core/profile/validations'
import {
  uploadAvatar,
  removeAvatar,
  changePassword,
  getCurrentProfile,
} from '@/lib/core/profile/actions'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { IconLoader2, IconUpload, IconLock } from '@tabler/icons-react'
import {
  generateInitials,
  getAvatarUrl,
  getShortNameParts,
} from '@/lib/core/profile/utils'
import { useAuth } from '@/hooks/use-auth'

type ProfileData = {
  id: string
  firstname: string | null
  lastname: string | null
  avatar_url: string | null
  email: string | null
}

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { refetch } = useAuth()

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const loadProfile = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getCurrentProfile()
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.profile) {
        const p = result.profile as any
        setProfile({
          id: p.id,
          firstname: p.firstname || null,
          lastname: p.lastname || null,
          avatar_url: p.avatar_url || null,
          email: p.email || null,
        })
        setAvatarPreview(p.avatar_url || null)
        setAvatarFile(null)
      }
    } catch {
      toast.error('Erreur lors du chargement du profil')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
    setAvatarFile(file)
  }

  const handleSaveAvatar = async () => {
    if (!avatarFile) return
    setIsUploadingAvatar(true)
    try {
      const result = await uploadAvatar(avatarFile)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Photo de profil mise à jour')
      await Promise.all([loadProfile(), refetch()])
      setAvatarFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setIsRemovingAvatar(true)
    try {
      const result = await removeAvatar()
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(result.message ?? 'Avatar supprimé')
      setAvatarFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await Promise.all([loadProfile(), refetch()])
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsRemovingAvatar(false)
    }
  }

  const onPasswordSubmit = async (data: ChangePasswordInput) => {
    setIsChangingPassword(true)
    try {
      const result = await changePassword(data)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(result.message ?? 'Mot de passe modifié')
      passwordForm.reset()
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const nameParts = getShortNameParts(
    profile?.firstname ?? null,
    profile?.lastname ?? null
  )
  const avatarSource = getAvatarUrl(
    avatarPreview || profile?.avatar_url || null,
    profile?.id || profile?.email || 'admin'
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Gérez votre photo de profil et la sécurité de votre compte"
        breadcrumbs={[
          { label: 'Dashboard Admin', href: '/admin/dashboard' },
          { label: 'Paramètres' },
        ]}
      />

      {/* Photo de profil */}
      <Card className="border-border/70 bg-background">
        <CardHeader className="space-y-1.5">
          <CardTitle className="text-base font-semibold">
            Photo de profil
          </CardTitle>
          <CardDescription className="text-sm">
            Mettez à jour votre photo de profil administrateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarSource} alt="Avatar administrateur" />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {generateInitials(nameParts.firstName, nameParts.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
                id="avatar-upload"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar || isRemovingAvatar}
                >
                  <IconUpload className="mr-2 h-4 w-4" />
                  Changer la photo
                </Button>
                {avatarFile && (
                  <Button
                    type="button"
                    onClick={handleSaveAvatar}
                    disabled={isUploadingAvatar || isRemovingAvatar}
                  >
                    {isUploadingAvatar ? (
                      <>
                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer la photo'
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar || isRemovingAvatar}
                  className="text-destructive hover:text-destructive"
                >
                  {isRemovingAvatar && (
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Supprimer l&apos;avatar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG ou WebP (maximum 2 MB). L&apos;image sera
                redimensionnée à 200×200 px.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mot de passe */}
      <Card className="border-border/70 bg-background">
        <CardHeader className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <IconLock className="h-4 w-4 text-muted-foreground" />
            Mot de passe
          </CardTitle>
          <CardDescription className="text-sm">
            Changez votre mot de passe pour sécuriser votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="space-y-5"
          >
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

            <div className="flex justify-end">
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
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

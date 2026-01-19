/**
 * Page de gestion du profil utilisateur
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/core/profile/validations"
import { updateProfile, getCurrentProfile, removeAvatar } from "@/lib/core/profile/actions"
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { IconLoader2, IconUpload } from '@tabler/icons-react'
import { generateInitials, getAvatarUrl } from "@/lib/core/profile/utils"
import { useAuth } from '@/hooks/use-auth'

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profile, setProfile] = useState<{
    id: string
    firstname: string | null
    lastname: string | null
    phone: string | null
    address: string | null
    bio: string | null
    avatar_url: string | null
    email: string | null
  } | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { refetch } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateProfileInput & { avatar?: File }>({
    resolver: zodResolver(updateProfileSchema),
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setIsLoading(true)
    try {
      const result = await getCurrentProfile()
      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.profile) {
        setProfile({
          id: (result.profile as any).id,
          firstname: (result.profile as any).firstname || '',
          lastname: (result.profile as any).lastname || '',
          phone: (result.profile as any).phone || '',
          address: (result.profile as any).address || '',
          bio: (result.profile as any).bio || '',
          avatar_url: (result.profile as any).avatar_url || null,
          email: (result.profile as any).email || null,
        })
        setAvatarPreview((result.profile as any).avatar_url)
        setAvatarFile(null)
        reset({
          firstname: (result.profile as any).firstname || '',
          lastname: (result.profile as any).lastname || '',
          phone: (result.profile as any).phone || '',
          address: (result.profile as any).address || '',
          bio: (result.profile as any).bio || '',
        })
      }
    } catch (error) {
      toast.error('Erreur lors du chargement du profil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Créer une preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setAvatarFile(file)
  }

  const handleRemoveAvatar = async () => {
    setIsRemovingAvatar(true)
    try {
      const result = await removeAvatar()

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.success) {
        toast.success(result.message)
        setAvatarPreview(null)
        setAvatarFile(null)
        await Promise.all([loadProfile(), refetch()])
      }
    } catch (error) {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsRemovingAvatar(false)
    }
  }

  const onSubmit = async (data: UpdateProfileInput & { avatar?: File }) => {
    setIsSubmitting(true)
    try {
      const result = await updateProfile({
        ...data,
        avatar: avatarFile || undefined,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.success) {
        toast.success(result.message)
        await Promise.all([loadProfile(), refetch()])
        setAvatarFile(null)
      }
    } catch (error) {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const avatarSource = getAvatarUrl(
    avatarPreview || profile?.avatar_url || null,
    profile?.id || profile?.email || 'user'
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon profil"
        description="Gérez vos informations personnelles et votre photo de profil"
      />

      {/* Vue d'ensemble */}
      <Card className="border-border/70 bg-background">
        <CardHeader className="space-y-1.5">
          <CardTitle className="text-base font-semibold">Vue d'ensemble</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarSource} alt="Avatar" />
              <AvatarFallback className="text-2xl">
                {generateInitials(
                  profile?.firstname || null,
                  profile?.lastname || null
                )}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2 flex-1">
              <h2 className="text-xl font-semibold">
                {profile?.firstname} {profile?.lastname}
              </h2>
              <p className="text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire de modification */}
      <Card className="border-border/70 bg-background">
        <CardHeader className="space-y-1.5">
          <CardTitle className="text-base font-semibold">Informations personnelles</CardTitle>
          <CardDescription className="text-sm">
            Mettez à jour vos informations personnelles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Photo de profil */}
            <div className="space-y-2">
              <Label>Photo de profil</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarSource} alt="Avatar" />
                  <AvatarFallback>
                    {generateInitials(
                      profile?.firstname || null,
                      profile?.lastname || null
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting || isRemovingAvatar}
                  >
                    <IconUpload className="mr-2 h-4 w-4" />
                    Changer la photo
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleRemoveAvatar}
                    disabled={isSubmitting || isRemovingAvatar}
                    className="text-destructive hover:text-destructive"
                  >
                    Supprimer l&apos;avatar
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG ou WebP (maximum 2 MB). L'image sera
                    redimensionnée à 200x200px.
                  </p>
                </div>
              </div>
            </div>

            {/* Prénom et Nom */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">Prénom</Label>
                <Input
                  id="firstname"
                  {...register('firstname')}
                  aria-invalid={errors.firstname ? 'true' : 'false'}
                  aria-describedby={
                    errors.firstname ? 'firstname-error' : undefined
                  }
                />
                {errors.firstname && (
                  <p
                    id="firstname-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {errors.firstname.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">Nom</Label>
                <Input
                  id="lastname"
                  {...register('lastname')}
                  aria-invalid={errors.lastname ? 'true' : 'false'}
                  aria-describedby={
                    errors.lastname ? 'lastname-error' : undefined
                  }
                />
                {errors.lastname && (
                  <p
                    id="lastname-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {errors.lastname.message}
                  </p>
                )}
              </div>
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+33123456789"
                {...register('phone')}
                aria-invalid={errors.phone ? 'true' : 'false'}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
              />
              {errors.phone && (
                <p
                  id="phone-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.phone.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Format : +33XXXXXXXXX ou +229XXXXXXXXX
              </p>
            </div>

            {/* Adresse */}
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                placeholder="123 Rue Example, 75001 Paris, France"
                {...register('address')}
                aria-invalid={errors.address ? 'true' : 'false'}
                aria-describedby={errors.address ? 'address-error' : undefined}
              />
              {errors.address && (
                <p
                  id="address-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.address.message}
                </p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio (optionnel)</Label>
              <Textarea
                id="bio"
                placeholder="Parlez-nous un peu de vous..."
                rows={4}
                {...register('bio')}
                aria-invalid={errors.bio ? 'true' : 'false'}
                aria-describedby={errors.bio ? 'bio-error' : undefined}
              />
              {errors.bio && (
                <p
                  id="bio-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.bio.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Maximum 500 caractères
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer les modifications'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

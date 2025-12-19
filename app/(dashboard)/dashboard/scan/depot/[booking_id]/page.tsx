/**
 * Page de scan QR pour le dépôt du colis
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  SignatureCanvas,
  type SignatureCanvasRef,
} from '@/components/features/bookings/SignatureCanvas'
import { markAsInTransit } from '@/lib/actions/booking-workflow'
import { Loader2, Camera, MapPin, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface ScanDepositPageProps {
  params: { booking_id: string }
}

export default function ScanDepositPage({ params }: ScanDepositPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [booking, setBooking] = useState<any>(null)
  const [scannedCode, setScannedCode] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const signatureRef = useRef<SignatureCanvasRef>(null)

  useEffect(() => {
    loadBooking()
    getCurrentLocation()
  }, [params.booking_id])

  const loadBooking = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Vous devez être connecté')
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', params.booking_id)
        .single()

      if (error || !data) {
        toast.error('Réservation introuvable')
        router.push('/dashboard/colis')
        return
      }

      if (data.traveler_id !== user.id) {
        toast.error('Accès non autorisé')
        router.push('/dashboard/colis')
        return
      }

      if (data.status !== 'confirmed') {
        toast.error('La réservation doit être confirmée')
        router.push(`/dashboard/colis/${params.booking_id}`)
        return
      }

      setBooking(data)
    } catch (error) {
      console.error('Error loading booking:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          toast.error('Impossible d\'obtenir la géolocalisation')
        }
      )
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La photo ne doit pas dépasser 5 Mo')
        return
      }
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadFile = async (file: File | Blob, path: string): Promise<string | null> => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from('package-proofs')
        .upload(path, file, {
          contentType: file instanceof File ? file.type : 'image/png',
          upsert: false,
        })

      if (error) {
        console.error('Upload error:', error)
        return null
      }

      const { data: { publicUrl } } = supabase.storage
        .from('package-proofs')
        .getPublicUrl(data.path)

      return publicUrl
    } catch (error) {
      console.error('Upload error:', error)
      return null
    }
  }

  const handleSubmit = async () => {
    if (!scannedCode) {
      toast.error('Veuillez scanner ou saisir le QR code')
      return
    }

    if (scannedCode.trim().toUpperCase() !== booking.qr_code?.trim().toUpperCase()) {
      toast.error('QR code invalide')
      return
    }

    if (!photo) {
      toast.error('Veuillez prendre une photo du colis')
      return
    }

    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error('Veuillez faire signer l\'expéditeur')
      return
    }

    if (!location) {
      toast.error('Géolocalisation requise')
      return
    }

    setIsSubmitting(true)

    try {
      // Upload photo
      const photoPath = `deposits/${params.booking_id}/${Date.now()}.jpg`
      const photoUrl = await uploadFile(photo, photoPath)

      if (!photoUrl) {
        toast.error('Erreur lors de l\'upload de la photo')
        return
      }

      // Upload signature
      const signatureDataUrl = signatureRef.current.getSignatureDataURL()
      if (!signatureDataUrl) {
        toast.error('Signature invalide')
        return
      }

      const signatureBlob = await fetch(signatureDataUrl).then((res) => res.blob())
      const signaturePath = `deposits/${params.booking_id}/signature_${Date.now()}.png`
      const signatureUrl = await uploadFile(signatureBlob, signaturePath)

      if (!signatureUrl) {
        toast.error('Erreur lors de l\'upload de la signature')
        return
      }

      // Marquer comme en transit
      const result = await markAsInTransit(
        params.booking_id,
        scannedCode,
        photoUrl,
        signatureUrl,
        location
      )

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Colis pris en charge !')
      router.push(`/dashboard/colis/${params.booking_id}`)
    } catch (error) {
      console.error('Error submitting deposit:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!booking) {
    return null
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scan QR Dépôt"
        description="Scanner le QR code et prendre les preuves de dépôt"
      />

      <div className="max-w-2xl mx-auto space-y-6">
        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle>1. Scanner le QR Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="qr-code">Code QR *</Label>
              <Input
                id="qr-code"
                placeholder="Scannez ou saisissez le code"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Code attendu : {booking.qr_code}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Photo */}
        <Card>
          <CardHeader>
            <CardTitle>2. Photo du Colis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="photo">Photographier le colis *</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                disabled={isSubmitting}
              />
            </div>
            {photoPreview && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                <img
                  src={photoPreview}
                  alt="Aperçu"
                  className="object-cover w-full h-full"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signature */}
        <Card>
          <CardHeader>
            <CardTitle>3. Signature de l'Expéditeur</CardTitle>
          </CardHeader>
          <CardContent>
            <SignatureCanvas ref={signatureRef} />
          </CardContent>
        </Card>

        {/* Géolocalisation */}
        <Card>
          <CardHeader>
            <CardTitle>4. Géolocalisation</CardTitle>
          </CardHeader>
          <CardContent>
            {location ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <MapPin className="h-4 w-4" />
                <span>Position enregistrée</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Récupération de la position...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" asChild className="flex-1">
            <Link href={`/dashboard/colis/${params.booking_id}`}>
              Annuler
            </Link>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Valider le dépôt
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

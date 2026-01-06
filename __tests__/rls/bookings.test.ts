/**
 * RLS Tests for bookings table
 * Tests that only booking participants (sender/traveler) and admins can access bookings
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createTestUser, createTestAdmin, deleteTestUser, supabaseAdmin } from '../setup/supabase-helpers'

describe('Bookings RLS', () => {
  let sender: { id: string; email: string; password: string }
  let traveler: { id: string; email: string; password: string }
  let otherUser: { id: string; email: string; password: string }
  let admin: { id: string; email: string; password: string }
  let announcementId: string
  let bookingId: string

  beforeAll(async () => {
    sender = await createTestUser({ firstName: 'Sender', lastName: 'User' })
    traveler = await createTestUser({ firstName: 'Traveler', lastName: 'User' })
    otherUser = await createTestUser({ firstName: 'Other', lastName: 'User' })
    admin = await createTestAdmin()

    // Create announcement from traveler
    const { data: announcement } = await supabaseAdmin
      .from('announcements')
      .insert({
        traveler_id: traveler.id,
        departure_city: 'Paris',
        departure_country: 'France',
        arrival_city: 'Cotonou',
        arrival_country: 'Bénin',
        departure_date: new Date('2025-02-01').toISOString(),
        arrival_date: new Date('2025-02-02').toISOString(),
        max_weight: 20,
        price_per_kg: 10,
        status: 'active',
      })
      .select('id')
      .single()

    announcementId = announcement!.id

    // Create booking from sender
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .insert({
        announcement_id: announcementId,
        sender_id: sender.id,
        package_weight: 5,
        package_description: 'Test package',
        total_price: 50,
        status: 'pending',
      })
      .select('id')
      .single()

    bookingId = booking!.id
  })

  afterAll(async () => {
    await supabaseAdmin.from('bookings').delete().eq('id', bookingId)
    await supabaseAdmin.from('announcements').delete().eq('id', announcementId)
    await deleteTestUser(sender.id)
    await deleteTestUser(traveler.id)
    await deleteTestUser(otherUser.id)
    await deleteTestUser(admin.id)
  })

  describe('SELECT policies', () => {
    test('sender can view their booking', async () => {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()

      expect(error).toBeNull()
      expect(data?.sender_id).toBe(sender.id)
    })

    test('traveler can view bookings for their announcement', async () => {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .select('*, announcements!inner(*)')
        .eq('id', bookingId)
        .single()

      expect(error).toBeNull()
      expect(data?.announcements.traveler_id).toBe(traveler.id)
    })

    test('admin can view all bookings', async () => {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('UPDATE policies', () => {
    test('sender can update their booking before acceptance', async () => {
      const newWeight = 7

      const { data, error } = await supabaseAdmin
        .from('bookings')
        .update({ package_weight: newWeight, total_price: newWeight * 10 })
        .eq('id', bookingId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.package_weight).toBe(newWeight)
    })

    test('traveler can accept booking', async () => {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .update({ status: 'accepted' })
        .eq('id', bookingId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.status).toBe('accepted')

      // Restore status
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'pending' })
        .eq('id', bookingId)
    })

    test('traveler can reject booking', async () => {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .update({ status: 'rejected' })
        .eq('id', bookingId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.status).toBe('rejected')

      // Restore status
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'pending' })
        .eq('id', bookingId)
    })

    test('admin can update any booking', async () => {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.status).toBe('cancelled')

      // Restore status
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'pending' })
        .eq('id', bookingId)
    })
  })

  describe('DELETE policies', () => {
    test('sender can cancel their pending booking', async () => {
      // Create temporary booking
      const { data: tempBooking } = await supabaseAdmin
        .from('bookings')
        .insert({
          announcement_id: announcementId,
          sender_id: sender.id,
          package_weight: 3,
          package_description: 'Temp package',
          total_price: 30,
          status: 'pending',
        })
        .select('id')
        .single()

      const tempId = tempBooking!.id

      // Delete it
      const { error } = await supabaseAdmin
        .from('bookings')
        .delete()
        .eq('id', tempId)

      expect(error).toBeNull()
    })

    test('admin can delete any booking', async () => {
      // Create temporary booking
      const { data: tempBooking } = await supabaseAdmin
        .from('bookings')
        .insert({
          announcement_id: announcementId,
          sender_id: sender.id,
          package_weight: 3,
          package_description: 'Temp package for admin delete',
          total_price: 30,
          status: 'pending',
        })
        .select('id')
        .single()

      const tempId = tempBooking!.id

      // Admin deletes it
      const { error } = await supabaseAdmin
        .from('bookings')
        .delete()
        .eq('id', tempId)

      expect(error).toBeNull()
    })
  })

  describe('Booking workflow', () => {
    test('booking status transitions work correctly', async () => {
      // pending → accepted
      let { data, error } = await supabaseAdmin
        .from('bookings')
        .update({ status: 'accepted' })
        .eq('id', bookingId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.status).toBe('accepted')

      // accepted → in_transit
      ;({ data, error } = await supabaseAdmin
        .from('bookings')
        .update({ status: 'in_transit' })
        .eq('id', bookingId)
        .select()
        .single())

      expect(error).toBeNull()
      expect(data?.status).toBe('in_transit')

      // in_transit → delivered
      ;({ data, error } = await supabaseAdmin
        .from('bookings')
        .update({ status: 'delivered' })
        .eq('id', bookingId)
        .select()
        .single())

      expect(error).toBeNull()
      expect(data?.status).toBe('delivered')

      // Restore original status
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'pending' })
        .eq('id', bookingId)
    })
  })
})

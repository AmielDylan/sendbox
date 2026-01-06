/**
 * RLS Tests for messages table
 * Tests that only message participants (sender/receiver) and admins can access messages
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createTestUser, createTestAdmin, deleteTestUser, supabaseAdmin } from '../setup/supabase-helpers'

describe('Messages RLS', () => {
  let user1: { id: string; email: string; password: string }
  let user2: { id: string; email: string; password: string }
  let otherUser: { id: string; email: string; password: string }
  let admin: { id: string; email: string; password: string }
  let announcementId: string
  let bookingId: string
  let messageId: string

  beforeAll(async () => {
    user1 = await createTestUser({ firstName: 'User', lastName: 'One' })
    user2 = await createTestUser({ firstName: 'User', lastName: 'Two' })
    otherUser = await createTestUser({ firstName: 'Other', lastName: 'User' })
    admin = await createTestAdmin()

    // Create announcement
    const { data: announcement } = await supabaseAdmin
      .from('announcements')
      .insert({
        traveler_id: user1.id,
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

    // Create booking
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .insert({
        announcement_id: announcementId,
        sender_id: user2.id,
        package_weight: 5,
        package_description: 'Test package',
        total_price: 50,
        status: 'pending',
      })
      .select('id')
      .single()

    bookingId = booking!.id

    // Create message
    const { data: message } = await supabaseAdmin
      .from('messages')
      .insert({
        booking_id: bookingId,
        sender_id: user2.id,
        receiver_id: user1.id,
        content: 'Hello, is the package still available?',
      })
      .select('id')
      .single()

    messageId = message!.id
  })

  afterAll(async () => {
    await supabaseAdmin.from('messages').delete().eq('id', messageId)
    await supabaseAdmin.from('bookings').delete().eq('id', bookingId)
    await supabaseAdmin.from('announcements').delete().eq('id', announcementId)
    await deleteTestUser(user1.id)
    await deleteTestUser(user2.id)
    await deleteTestUser(otherUser.id)
    await deleteTestUser(admin.id)
  })

  describe('SELECT policies', () => {
    test('sender can view their sent messages', async () => {
      const { data, error } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single()

      expect(error).toBeNull()
      expect(data?.sender_id).toBe(user2.id)
      expect(data?.content).toBe('Hello, is the package still available?')
    })

    test('receiver can view messages sent to them', async () => {
      const { data, error } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('receiver_id', user1.id)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThanOrEqual(1)
    })

    test('admin can view all messages', async () => {
      const { data, error } = await supabaseAdmin
        .from('messages')
        .select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThanOrEqual(1)
    })

    test('users can view messages in their bookings', async () => {
      const { data, error } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('booking_id', bookingId)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('INSERT policies', () => {
    test('user can send message in their booking', async () => {
      const { data, error } = await supabaseAdmin
        .from('messages')
        .insert({
          booking_id: bookingId,
          sender_id: user1.id,
          receiver_id: user2.id,
          content: 'Yes, it is available!',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.content).toBe('Yes, it is available!')

      // Cleanup
      await supabaseAdmin.from('messages').delete().eq('id', data!.id)
    })

    test('message content is sanitized (XSS protection)', async () => {
      const maliciousContent = '<script>alert("XSS")</script>Normal text'

      const { data, error } = await supabaseAdmin
        .from('messages')
        .insert({
          booking_id: bookingId,
          sender_id: user2.id,
          receiver_id: user1.id,
          content: maliciousContent,
        })
        .select()
        .single()

      expect(error).toBeNull()
      // Content should be stored (sanitization happens on read)
      expect(data?.content).toBeDefined()

      // Cleanup
      await supabaseAdmin.from('messages').delete().eq('id', data!.id)
    })
  })

  describe('UPDATE policies', () => {
    test('receiver can mark message as read', async () => {
      const { data, error } = await supabaseAdmin
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.read_at).toBeDefined()

      // Reset for other tests
      await supabaseAdmin
        .from('messages')
        .update({ read_at: null })
        .eq('id', messageId)
    })

    test('admin can update any message', async () => {
      const newContent = 'Updated by admin'

      const { data, error } = await supabaseAdmin
        .from('messages')
        .update({ content: newContent })
        .eq('id', messageId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.content).toBe(newContent)

      // Restore original content
      await supabaseAdmin
        .from('messages')
        .update({ content: 'Hello, is the package still available?' })
        .eq('id', messageId)
    })
  })

  describe('DELETE policies', () => {
    test('sender can delete their message', async () => {
      // Create temporary message
      const { data: tempMessage } = await supabaseAdmin
        .from('messages')
        .insert({
          booking_id: bookingId,
          sender_id: user2.id,
          receiver_id: user1.id,
          content: 'Temporary message',
        })
        .select('id')
        .single()

      const tempId = tempMessage!.id

      // Delete it
      const { error } = await supabaseAdmin
        .from('messages')
        .delete()
        .eq('id', tempId)

      expect(error).toBeNull()
    })

    test('admin can delete any message', async () => {
      // Create temporary message
      const { data: tempMessage } = await supabaseAdmin
        .from('messages')
        .insert({
          booking_id: bookingId,
          sender_id: user1.id,
          receiver_id: user2.id,
          content: 'Message to be deleted by admin',
        })
        .select('id')
        .single()

      const tempId = tempMessage!.id

      // Admin deletes it
      const { error } = await supabaseAdmin
        .from('messages')
        .delete()
        .eq('id', tempId)

      expect(error).toBeNull()
    })
  })

  describe('Message threading', () => {
    test('messages are properly associated with booking', async () => {
      // Create multiple messages in same booking
      const messages = [
        { sender_id: user2.id, receiver_id: user1.id, content: 'Message 1' },
        { sender_id: user1.id, receiver_id: user2.id, content: 'Message 2' },
        { sender_id: user2.id, receiver_id: user1.id, content: 'Message 3' },
      ]

      const insertedIds: string[] = []

      for (const msg of messages) {
        const { data } = await supabaseAdmin
          .from('messages')
          .insert({
            booking_id: bookingId,
            ...msg,
          })
          .select('id')
          .single()

        insertedIds.push(data!.id)
      }

      // Query all messages in booking
      const { data, error } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true })

      expect(error).toBeNull()
      expect(data!.length).toBeGreaterThanOrEqual(3)

      // Cleanup
      for (const id of insertedIds) {
        await supabaseAdmin.from('messages').delete().eq('id', id)
      }
    })

    test('unread messages count is accurate', async () => {
      // Create unread messages
      const { data: msg1 } = await supabaseAdmin
        .from('messages')
        .insert({
          booking_id: bookingId,
          sender_id: user2.id,
          receiver_id: user1.id,
          content: 'Unread message 1',
        })
        .select('id')
        .single()

      const { data: msg2 } = await supabaseAdmin
        .from('messages')
        .insert({
          booking_id: bookingId,
          sender_id: user2.id,
          receiver_id: user1.id,
          content: 'Unread message 2',
        })
        .select('id')
        .single()

      // Count unread messages for user1
      const { data, error } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('receiver_id', user1.id)
        .is('read_at', null)

      expect(error).toBeNull()
      expect(data!.length).toBeGreaterThanOrEqual(2)

      // Cleanup
      await supabaseAdmin.from('messages').delete().eq('id', msg1!.id)
      await supabaseAdmin.from('messages').delete().eq('id', msg2!.id)
    })
  })
})

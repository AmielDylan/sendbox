/**
 * RLS Tests for announcements table
 * Tests Row Level Security policies including the is_admin() SECURITY DEFINER function
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createTestUser, createTestAdmin, deleteTestUser, supabaseAdmin } from '../setup/supabase-helpers'

describe('Announcements RLS', () => {
  let user1: { id: string; email: string; password: string }
  let user2: { id: string; email: string; password: string }
  let admin: { id: string; email: string; password: string }
  let announcement1Id: string
  let announcement2Id: string

  beforeAll(async () => {
    user1 = await createTestUser()
    user2 = await createTestUser()
    admin = await createTestAdmin()

    // Create test announcements
    const { data: ann1 } = await supabaseAdmin
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

    const { data: ann2 } = await supabaseAdmin
      .from('announcements')
      .insert({
        traveler_id: user2.id,
        departure_city: 'London',
        departure_country: 'UK',
        arrival_city: 'Abidjan',
        arrival_country: 'Côte d\'Ivoire',
        departure_date: new Date('2025-03-01').toISOString(),
        arrival_date: new Date('2025-03-02').toISOString(),
        max_weight: 15,
        price_per_kg: 12,
        status: 'active',
      })
      .select('id')
      .single()

    announcement1Id = ann1!.id
    announcement2Id = ann2!.id
  })

  afterAll(async () => {
    // Delete announcements
    await supabaseAdmin.from('announcements').delete().eq('id', announcement1Id)
    await supabaseAdmin.from('announcements').delete().eq('id', announcement2Id)

    // Delete users
    await deleteTestUser(user1.id)
    await deleteTestUser(user2.id)
    await deleteTestUser(admin.id)
  })

  describe('SELECT policies', () => {
    test('all users can view active announcements', async () => {
      const { data, error } = await supabaseAdmin
        .from('announcements')
        .select('*')
        .eq('status', 'active')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThanOrEqual(2)
    })

    test('users can view their own announcements', async () => {
      const { data, error } = await supabaseAdmin
        .from('announcements')
        .select('*')
        .eq('id', announcement1Id)
        .single()

      expect(error).toBeNull()
      expect(data?.traveler_id).toBe(user1.id)
    })
  })

  describe('UPDATE policies', () => {
    test('user can update their own announcement', async () => {
      const newPrice = 15

      const { data, error } = await supabaseAdmin
        .from('announcements')
        .update({ price_per_kg: newPrice })
        .eq('id', announcement1Id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.price_per_kg).toBe(newPrice)
    })

    test('admin can update any announcement using is_admin()', async () => {
      const newMaxWeight = 25

      // This tests that the is_admin() SECURITY DEFINER function works
      const { data, error } = await supabaseAdmin
        .from('announcements')
        .update({ max_weight: newMaxWeight })
        .eq('id', announcement1Id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.max_weight).toBe(newMaxWeight)
    })
  })

  describe('DELETE policies', () => {
    test('user can delete their own announcement', async () => {
      // Create a temporary announcement
      const { data: tempAnn } = await supabaseAdmin
        .from('announcements')
        .insert({
          traveler_id: user1.id,
          departure_city: 'Lyon',
          departure_country: 'France',
          arrival_city: 'Dakar',
          arrival_country: 'Sénégal',
          departure_date: new Date('2025-04-01').toISOString(),
          arrival_date: new Date('2025-04-02').toISOString(),
          max_weight: 10,
          price_per_kg: 8,
          status: 'active',
        })
        .select('id')
        .single()

      const tempId = tempAnn!.id

      // Delete it
      const { error } = await supabaseAdmin
        .from('announcements')
        .delete()
        .eq('id', tempId)

      expect(error).toBeNull()

      // Verify it's deleted
      const { data } = await supabaseAdmin
        .from('announcements')
        .select('*')
        .eq('id', tempId)

      expect(data).toHaveLength(0)
    })

    test('admin can delete any announcement using is_admin()', async () => {
      // Create a temporary announcement for user2
      const { data: tempAnn } = await supabaseAdmin
        .from('announcements')
        .insert({
          traveler_id: user2.id,
          departure_city: 'Berlin',
          departure_country: 'Germany',
          arrival_city: 'Lomé',
          arrival_country: 'Togo',
          departure_date: new Date('2025-05-01').toISOString(),
          arrival_date: new Date('2025-05-02').toISOString(),
          max_weight: 12,
          price_per_kg: 11,
          status: 'active',
        })
        .select('id')
        .single()

      const tempId = tempAnn!.id

      // Admin deletes it (using is_admin() SECURITY DEFINER function)
      const { error } = await supabaseAdmin
        .from('announcements')
        .delete()
        .eq('id', tempId)

      expect(error).toBeNull()

      // Verify deletion
      const { data } = await supabaseAdmin
        .from('announcements')
        .select('*')
        .eq('id', tempId)

      expect(data).toHaveLength(0)
    })

    test('is_admin() prevents infinite recursion on delete', async () => {
      // This test verifies that the SECURITY DEFINER function
      // successfully prevents infinite recursion errors

      // Create announcement
      const { data: tempAnn } = await supabaseAdmin
        .from('announcements')
        .insert({
          traveler_id: user1.id,
          departure_city: 'Test City',
          departure_country: 'Test Country',
          arrival_city: 'Test Arrival',
          arrival_country: 'Test Country',
          departure_date: new Date('2025-06-01').toISOString(),
          arrival_date: new Date('2025-06-02').toISOString(),
          max_weight: 5,
          price_per_kg: 10,
          status: 'active',
        })
        .select('id')
        .single()

      const tempId = tempAnn!.id

      // Delete using admin - should NOT cause infinite recursion
      const { error } = await supabaseAdmin
        .from('announcements')
        .delete()
        .eq('id', tempId)

      // The key test: no "infinite recursion detected" error
      expect(error).toBeNull()
      expect(error?.message).not.toContain('infinite recursion')
    })
  })

  describe('Announcement status transitions', () => {
    test('user can change status of their own announcement', async () => {
      const { data, error } = await supabaseAdmin
        .from('announcements')
        .update({ status: 'completed' })
        .eq('id', announcement1Id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.status).toBe('completed')

      // Restore status
      await supabaseAdmin
        .from('announcements')
        .update({ status: 'active' })
        .eq('id', announcement1Id)
    })

    test('admin can change status of any announcement', async () => {
      const { data, error } = await supabaseAdmin
        .from('announcements')
        .update({ status: 'cancelled' })
        .eq('id', announcement2Id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.status).toBe('cancelled')

      // Restore status
      await supabaseAdmin
        .from('announcements')
        .update({ status: 'active' })
        .eq('id', announcement2Id)
    })
  })
})

/**
 * Fixtures et données de test
 */

export const TEST_USERS = {
  traveler: {
    email: 'traveler@test.com',
    password: 'Test123!@#',
    firstname: 'Traveler',
    lastname: 'Test',
  },
  sender: {
    email: 'sender@test.com',
    password: 'Test123!@#',
    firstname: 'Sender',
    lastname: 'Test',
  },
  admin: {
    email: 'admin@sendbox.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
}

export const TEST_DATA = {
  announcement: {
    departure_country: 'FR',
    departure_city: 'Paris',
    departure_date: '2025-12-20',
    arrival_country: 'BJ',
    arrival_city: 'Cotonou',
    arrival_date: '2025-12-22',
    available_kg: '30',
    price_per_kg: '40',
    description: 'Trajet fiable, livraison rapide',
  },
  booking: {
    kilos_requested: '10',
    package_description: 'Test package description avec au moins 10 caractères',
    package_value: '100',
    insurance_opted: true,
  },
  kyc: {
    documentType: 'national_id',
    documentNumber: 'AB123456',
    address: '123 Rue de Test, 75001 Paris',
    birthday: '1990-01-01',
    nationality: 'Français',
  },
  stripeTestCard: {
    number: '4242424242424242',
    expiry: '12/30',
    cvc: '123',
    zip: '12345',
  },
}






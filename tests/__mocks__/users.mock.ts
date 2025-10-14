import { InsertUser, UpdateUser, UserSafe, User, IPAddress } from '../../src/modules/users/users.types';

/** Mock pour InsertUser */
export const mockInsertUser: InsertUser = {
	email: 'alice@example.com',
	pseudo: 'alice'
};

/** Mock pour UpdateUser */
export const mockUpdateUser: UpdateUser = {
	email: 'bob@example.com',
	pseudo: 'bob_the_builder'
};

/** Dates communes pour les mocks */
const now = new Date('2025-10-14T12:00:00.000Z');

/** Mock pour UserSafe Alice */
export const mockUserSafeAlice: UserSafe = {
	id: 1,
	email: 'alice@example.com',
	pseudo: 'alice',
	is_connected: true,
	is_verified_email: true,
	last_login: now,
	auth_methods: [],
	created_at: now,
	updated_at: now
};

/** Mock pour UserSafe Bob */
export const mockUserSafeBob: UserSafe = {
	id: 2,
	email: 'bob@example.com',
	pseudo: 'bob_the_builder',
	is_connected: true,
	is_verified_email: true,
	last_login: now,
	auth_methods: [],
	created_at: now,
	updated_at: now
};

/** Mocks pour IPAddress (IPv4 et IPv6) */
export const mockIPAddressIPv4: IPAddress = '192.0.2.1';
export const mockIPAddressIPv6: IPAddress = '2001:db8::1';

/** Mock pour User (complet) with Alice for base */
export const mockUser: User = {
	...mockUserSafeAlice,
	last_ip: mockIPAddressIPv4,
	password_hash: null,
	secret_hash: null
};

/** Collection utile pour les tests */
export const mockUsers: User[] = [mockUser];

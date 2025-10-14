describe('Users test', () => {
	it('Create user', async () => {
		// Arrange
		const { mockInsertUser, mockUser, mockUserSafeAlice, mockIPAddressIPv4 } = require('../../__mocks__/users.mock');

		// Import modules under test and helpers
		const UsersService = require('../../../src/modules/users/users.service');
		const UsersRepository = require('../../../src/modules/users/users.repository');
		const JwtUtils = require('../../../src/core/utils/jwt');

		// Mock repository and jwt functions
		UsersRepository.insertUser = jest.fn().mockResolvedValue(mockUser);
		JwtUtils.generateJwt = jest.fn().mockResolvedValue('fake-jwt');

		// Act
		const token = await UsersService.insertUser(mockInsertUser, mockIPAddressIPv4);

		// Assert
		expect(UsersRepository.insertUser).toHaveBeenCalledTimes(1);
		expect(UsersRepository.insertUser).toHaveBeenCalledWith(mockInsertUser, mockIPAddressIPv4);
		expect(JwtUtils.generateJwt).toHaveBeenCalledTimes(1);
		// generateJwt should be called with a UserSafe-like object; check key properties
		expect(JwtUtils.generateJwt).toHaveBeenCalledWith(expect.objectContaining({
			id: mockUserSafeAlice.id,
			email: mockUserSafeAlice.email,
			pseudo: mockUserSafeAlice.pseudo
		}));
		expect(token).toBe('fake-jwt');
	});
});

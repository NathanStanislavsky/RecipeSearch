import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { POST } from './+server.js';
import { mockRequestEvent } from '../../utils/test/mockUtils.js';

interface LogoutRequestEvent extends RequestEvent {
	route: {
		id: '/logout';
	};
}

describe('logout endpoint', () => {
	const TEST_CONSTANTS = {
		userId: 1,
		name: 'Test User',
		email: 'test@example.com',
		baseUrl: 'http://localhost/logout'
	} as const;

	const createLogoutRequestEvent = (): LogoutRequestEvent => {
		const event = mockRequestEvent(TEST_CONSTANTS.baseUrl) as LogoutRequestEvent;
		return {
			...event,
			route: { id: '/logout' },
			locals: {
				user: {
					id: TEST_CONSTANTS.userId,
					name: TEST_CONSTANTS.name,
					email: TEST_CONSTANTS.email
				}
			}
		};
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deletes the jwt cookie and redirects to home', async () => {
		const event = createLogoutRequestEvent();
		const cookies = event.cookies;

		await expect(POST(event)).rejects.toMatchObject({
			status: 302,
			location: '/'
		});

		expect(cookies.delete).toHaveBeenCalledWith('jwt', { path: '/' });
	});
});

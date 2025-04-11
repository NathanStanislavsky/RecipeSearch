import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { actions } from './+page.server.js';
import { mockRequestEvent } from '../../utils/test/mockUtils.js';

type User = {
	id: number;
	name: string;
	email: string;
};

interface LogoutRequestEvent extends RequestEvent {
	route: {
		id: '/logout';
	};
	locals: {
		user: User;
	};
}

describe('logout endpoint', () => {
	const TEST_CONSTANTS = {
		userId: 1,
		name: 'Test User',
		email: 'test@example.com',
		baseUrl: 'http://localhost/logout'
	} as const;

	const createLogoutRequestEvent = (user?: User): LogoutRequestEvent => {
		const formData = new FormData();
		const request = new Request(TEST_CONSTANTS.baseUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: formData
		});
		const event = mockRequestEvent(TEST_CONSTANTS.baseUrl) as LogoutRequestEvent;
		return {
			...event,
			request,
			route: { id: '/logout' },
			locals: {
				user: user || {
					id: TEST_CONSTANTS.userId,
					name: TEST_CONSTANTS.name,
					email: TEST_CONSTANTS.email
				}
			}
		};
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	it('deletes the jwt cookie and redirects to home', async () => {
		const event = createLogoutRequestEvent();
		const cookies = event.cookies;

		await expect(actions.default(event)).rejects.toMatchObject({
			status: 302,
			location: '/'
		});

		expect(cookies.delete).toHaveBeenCalledWith('jwt', { path: '/' });
	});

	it('handles missing jwt cookie gracefully', async () => {
		const event = createLogoutRequestEvent();
		vi.spyOn(event.cookies, 'delete').mockImplementation(() => {
			throw new Error('Cookie not found');
		});

		await expect(actions.default(event)).rejects.toMatchObject({
			status: 302,
			location: '/'
		});

		expect(event.cookies.delete).toHaveBeenCalledWith('jwt', { path: '/' });
	});

	it('handles concurrent logout attempts', async () => {
		const event1 = createLogoutRequestEvent();
		const event2 = createLogoutRequestEvent();

		const [result1, result2] = await Promise.allSettled([
			actions.default(event1),
			actions.default(event2)
		]);

		expect(result1.status).toBe('rejected');
		expect(result2.status).toBe('rejected');
		expect(event1.cookies.delete).toHaveBeenCalledWith('jwt', { path: '/' });
		expect(event2.cookies.delete).toHaveBeenCalledWith('jwt', { path: '/' });
	});

	it('handles different HTTP methods', async () => {
		const event = createLogoutRequestEvent();
		event.request = new Request(TEST_CONSTANTS.baseUrl, {
			method: 'GET'
		});

		await expect(actions.default(event)).rejects.toMatchObject({
			status: 302,
			location: '/'
		});

		expect(event.cookies.delete).toHaveBeenCalledWith('jwt', { path: '/' });
	});

	it('handles missing user in locals', async () => {
		const event = createLogoutRequestEvent({
			id: 0,
			name: '',
			email: ''
		});

		await expect(actions.default(event)).rejects.toMatchObject({
			status: 302,
			location: '/'
		});

		expect(event.cookies.delete).toHaveBeenCalledWith('jwt', { path: '/' });
	});
});

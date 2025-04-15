import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { actions } from './+page.server.js';
import { TestHelper } from '../../utils/test/testHelper.ts';
import { TEST_USER } from '../../utils/test/testConstants.js';
import { createFakeUser } from '../../utils/test/userTestUtils.js';
import type { User } from '../../types/user.ts';

type LogoutRequestEvent = RequestEvent & {
	route: { id: '/logout' };
};

describe('logout endpoint', () => {
	const createLogoutRequest = () => {
		const formData = new FormData();
		const request = new Request('http://localhost/logout', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: formData
		});
		return request;
	};

	const createLogoutRequestEvent = (user?: User): LogoutRequestEvent => {
		const request = createLogoutRequest();
		const event = TestHelper.createMockRequestEvent('http://localhost/logout', {
			user: user || {
				id: TEST_USER.userId,
				name: TEST_USER.name,
				email: TEST_USER.email
			}
		}) as LogoutRequestEvent;
		return {
			...event,
			request,
			route: { id: '/logout' }
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
		event.request = new Request('http://localhost/logout', {
			method: 'GET'
		});

		await expect(actions.default(event)).rejects.toMatchObject({
			status: 302,
			location: '/'
		});

		expect(event.cookies.delete).toHaveBeenCalledWith('jwt', { path: '/' });
	});

	it('handles missing user in locals', async () => {
		const emptyUser = await createFakeUser();
		emptyUser.id = 0;
		emptyUser.name = '';
		emptyUser.email = '';
		const event = createLogoutRequestEvent(emptyUser);

		await expect(actions.default(event)).rejects.toMatchObject({
			status: 302,
			location: '/'
		});

		expect(event.cookies.delete).toHaveBeenCalledWith('jwt', { path: '/' });
	});
});

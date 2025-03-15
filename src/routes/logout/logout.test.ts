import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from './+server';

describe('logout endpoint', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deletes the jwt cookie and redirects to home', async () => {
		const cookies = {
			delete: vi.fn()
		};

		await expect(DELETE({ cookies })).rejects.toMatchObject({
			status: 302,
			location: '/'
		});

		expect(cookies.delete).toHaveBeenCalledWith('jwt', { path: '/' });
	});
});

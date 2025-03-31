import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { POST } from './+server.js';

interface LogoutRequestEvent extends RequestEvent {
    route: {
        id: '/logout';
    };
}

describe('logout endpoint', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deletes the jwt cookie and redirects to home', async () => {
        const cookies = {
            delete: vi.fn(),
            get: vi.fn(),
            getAll: vi.fn(),
            set: vi.fn(),
            serialize: vi.fn()
        } as unknown as Cookies;

        const event: LogoutRequestEvent = {
            request: new Request('http://localhost/logout'),
            cookies,
            fetch: vi.fn(),
            getClientAddress: () => '127.0.0.1',
            locals: {
                user: {
                    id: 1,
                    name: 'Test User',
                    email: 'test@example.com'
                }
            },
            params: {},
            platform: {},
            route: { id: '/logout' },
            setHeaders: vi.fn(),
            url: new URL('http://localhost/logout'),
            isDataRequest: false,
            isSubRequest: false
        };

        await expect(POST(event)).rejects.toMatchObject({
            status: 302,
            location: '/'
        });

        expect(cookies.delete).toHaveBeenCalledWith('jwt', { path: '/' });
    });
});

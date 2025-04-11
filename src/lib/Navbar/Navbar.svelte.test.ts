import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Navbar from '$lib/Navbar/Navbar.svelte';
import { createMockResponse } from '../../utils/test/mockUtils.js';

describe('navigation bar', () => {
	beforeEach(() => {
		Object.defineProperty(window, 'location', {
			configurable: true,
			writable: true,
			value: {
				href: '',
				assign: vi.fn(),
				replace: vi.fn(),
				reload: vi.fn()
			}
		});
	});

	describe('rendering', () => {
		it('renders the website name', () => {
			render(Navbar);
			expect(screen.getByText('PantryChef')).toBeInTheDocument();
		});

		it('shows "Register" and "Sign in" when user is not logged in and not on auth pages', () => {
			render(Navbar, { user: null, currentPath: '/' });

			expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
			expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
		});

		it('shows logout button when user is logged in', () => {
			render(Navbar, { user: { id: 1, email: 'test@example.com' } });

			expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /register/i })).not.toBeInTheDocument();
			expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
		});
	});

	describe('path-based rendering', () => {
		const paths = ['/login', '/register', '/search'];
		const testCases = paths.map((path) => ({
			path,
			description: `hides auth links when on ${path} page`
		}));

		testCases.forEach(({ path, description }) => {
			it(description, () => {
				render(Navbar, { user: null, currentPath: path });

				expect(screen.queryByRole('button', { name: /register/i })).not.toBeInTheDocument();
				expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
			});
		});
	});

	describe('logout functionality', () => {
		const mockUser = { id: 1, email: 'test@example.com' };

		it('handles logout successfully', async () => {
			const mockFetch = vi
				.spyOn(global, 'fetch')
				.mockResolvedValueOnce(createMockResponse(null, 200));

			render(Navbar, { user: mockUser });
			const logoutButton = screen.getByRole('button', { name: /logout/i });
			await fireEvent.click(logoutButton);

			expect(mockFetch).toHaveBeenCalledWith('/logout', {
				method: 'POST',
				body: expect.any(FormData)
			});
			expect(window.location.href).toBe('/');
		});

		it('handles logout error gracefully', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

			render(Navbar, { user: mockUser });
			const logoutButton = screen.getByRole('button', { name: /logout/i });
			await fireEvent.click(logoutButton);

			expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
			expect(window.location.href).not.toBe('/');
		});
	});
});

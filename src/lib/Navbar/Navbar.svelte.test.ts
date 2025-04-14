import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Navbar from './Navbar.svelte';
import { TestHelper } from '../../utils/test/testHelper.ts';
import { createFakeUser } from '../../utils/test/userTestUtils.js';

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

		it('shows logout button when user is logged in', async () => {
			const mockUser = await createFakeUser();
			render(Navbar, { user: mockUser });

			expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /register/i })).not.toBeInTheDocument();
			expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
		});

		it('applies correct styling to navigation elements', () => {
			render(Navbar);
			const nav = screen.getByRole('navigation');
			expect(nav).toHaveClass(
				'fixed',
				'top-0',
				'z-50',
				'flex',
				'h-16',
				'items-center',
				'border-b',
				'border-gray-200',
				'bg-white',
				'px-6',
				'font-serif'
			);
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

		describe('shows auth links when on non-auth pages', () => {
			const nonAuthPaths = ['/'];

			nonAuthPaths.forEach((path) => {
				it(`shows auth links on the "${path}" page`, () => {
					render(Navbar, { user: null, currentPath: path });
					expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
					expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
				});
			});
		});
	});

	describe('navigation functionality', () => {
		it('navigates to register page when register button is clicked', () => {
			render(Navbar, { user: null, currentPath: '/' });
			const registerButton = screen.getByRole('button', { name: /register/i });
			expect(registerButton.closest('a')).toHaveAttribute('href', '/register');
		});

		it('navigates to login page when sign in link is clicked', () => {
			render(Navbar, { user: null, currentPath: '/' });
			const signInLink = screen.getByRole('link', { name: /sign in/i });
			expect(signInLink).toHaveAttribute('href', '/login');
		});
	});

	describe('logout functionality', () => {
		let mockUser: Awaited<ReturnType<typeof createFakeUser>>;

		beforeEach(async () => {
			mockUser = await createFakeUser();

			window.location.href = '';
		});

		it('handles logout successfully', async () => {
			const mockFetch = vi
				.spyOn(global, 'fetch')
				.mockResolvedValueOnce(TestHelper.createMockResponse(null, 200));

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

		it('does not redirect on failed logout response', async () => {
			vi.spyOn(global, 'fetch').mockResolvedValueOnce(TestHelper.createMockResponse(null, 500));

			render(Navbar, { user: mockUser });
			const logoutButton = screen.getByRole('button', { name: /logout/i });
			await fireEvent.click(logoutButton);

			expect(window.location.href).not.toBe('/');
		});
	});
});

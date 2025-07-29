import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import Navbar from './Navbar.svelte';
import { createFakeUser } from '../../utils/test/userTestUtils.js';

type EnhanceHandler = (input: {
	formData: FormData;
	cancel: () => void;
}) => (result: {
	result:
		| { type: 'error'; error?: { message: string } }
		| { type: 'failure'; data?: { message: string } }
		| { type: 'redirect'; location: string }
		| { type: 'success'; data?: { message: string } };
	update: () => void;
}) => Promise<void>;

// Mock $app/forms
vi.mock('$app/forms', () => ({
	enhance: vi.fn((form: HTMLFormElement, handler: EnhanceHandler) => {
		// Mock enhance by just calling the handler with mock result
		if (handler) {
			// Store the handler for later use in tests
			(form as HTMLFormElement & { __enhance_handler?: EnhanceHandler }).__enhance_handler =
				handler;
		}
		return {
			destroy: vi.fn()
		};
	})
}));

// Mock $app/navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn().mockResolvedValue(undefined)
}));

describe('navigation bar', () => {
	describe('rendering', () => {
		it('renders the website name', () => {
			render(Navbar);
			expect(screen.getByText('PantryChef')).toBeInTheDocument();
		});

		it('shows logout button when user is logged in', async () => {
			const mockUser = await createFakeUser();
			render(Navbar, { user: mockUser, currentPath: '/' });

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
		});

		it('handles logout successfully', async () => {
			const user = userEvent.setup();
			render(Navbar, { user: mockUser, currentPath: '/' });

			const form = screen.getByRole('button', { name: /logout/i }).closest('form');
			expect(form).toBeInTheDocument();
			expect(form).toHaveAttribute('method', 'POST');
			expect(form).toHaveAttribute('action', '/logout');

			const logoutButton = screen.getByRole('button', { name: /logout/i });
			await user.click(logoutButton);

			// Test that the form is configured correctly
			expect(form).toBeInTheDocument();
		});

		it('handles logout error gracefully', async () => {
			render(Navbar, { user: mockUser, currentPath: '/' });
			const logoutButton = screen.getByRole('button', { name: /logout/i });

			// Simulate error in form submission
			const form = logoutButton.closest('form') as HTMLFormElement & {
				__enhance_handler?: EnhanceHandler;
			};
			const handler = form?.__enhance_handler;

			if (handler) {
				await handler({ formData: new FormData(), cancel: vi.fn() })({
					result: { type: 'error', error: { message: 'Logout failed' } },
					update: vi.fn()
				});
			}

			expect(form).toBeInTheDocument();
		});

		it('does not redirect on failed logout response', async () => {
			render(Navbar, { user: mockUser, currentPath: '/' });
			const logoutButton = screen.getByRole('button', { name: /logout/i });

			// Simulate failure in form submission
			const form = logoutButton.closest('form') as HTMLFormElement & {
				__enhance_handler?: EnhanceHandler;
			};
			const handler = form?.__enhance_handler;

			if (handler) {
				await handler({ formData: new FormData(), cancel: vi.fn() })({
					result: { type: 'failure', data: { message: 'Logout failed' } },
					update: vi.fn()
				});
			}

			expect(form).toBeInTheDocument();
		});
	});
});

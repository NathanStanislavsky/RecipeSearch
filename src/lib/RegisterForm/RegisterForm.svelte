<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	let name: string = '';
	let email: string = '';
	let password: string = '';
	let message: string = '';
	let isLoading = false;

	const handleSubmit: SubmitFunction = ({ formData, cancel }) => {
		isLoading = true;
		message = '';

		return async ({ result, update }) => {
			isLoading = false;

			if (result.type === 'redirect') {
				await update();
				return;
			} else if (result.type === 'error') {
				message = result.error?.message || 'Registration failed';
			} else if (result.type === 'failure') {
				message = result.data?.message || 'Registration failed';
			}
		};
	};
</script>

<div class="flex h-full items-center justify-center">
	<div class="w-full max-w-md rounded-md bg-white p-6 shadow-md">
		<h1 class="mb-6 text-center text-2xl font-bold">Register</h1>
		<form data-testid="register-form" method="POST" use:enhance={handleSubmit} class="space-y-4">
			<div>
				<label for="name" class="block text-sm font-medium text-gray-700">Username</label>
				<input
					type="text"
					id="name"
					name="name"
					bind:value={name}
					required
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					placeholder="Enter a username"
				/>
			</div>
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
				<input
					type="email"
					id="email"
					name="email"
					bind:value={email}
					required
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					placeholder="Enter an email"
				/>
			</div>
			<div>
				<label for="password" class="block text-sm font-medium text-gray-700">Password</label>
				<input
					type="password"
					id="password"
					name="password"
					bind:value={password}
					required
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					placeholder="Enter a password"
				/>
			</div>
			<div>
				<button
					type="submit"
					disabled={isLoading}
					class="w-full rounded-md bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
				>
					{isLoading ? 'Registering...' : 'Register'}
				</button>
			</div>
		</form>
		{#if message}
			<p class="mt-4 text-center text-lg">{message}</p>
		{/if}
	</div>
</div>

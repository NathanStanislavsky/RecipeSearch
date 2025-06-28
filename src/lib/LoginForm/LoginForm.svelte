<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

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
				message = result.error?.message || 'Login failed';
			} else if (result.type === 'failure') {
				message = result.data?.message || 'Login failed';
			}
		};
	};
</script>

<div class="flex items-center justify-center">
	<div class="w-full max-w-md rounded-md bg-white p-6 shadow-md">
		<h1 class="mb-6 text-center text-2xl font-bold">Login</h1>
		<form method="POST" use:enhance={handleSubmit} class="space-y-4">
			{#if message}
				<div class="rounded-md bg-red-50 p-4 text-red-700">
					{message}
				</div>
			{/if}
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
				<input
					type="email"
					id="email"
					name="email"
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
					{isLoading ? 'Logging in...' : 'Login'}
				</button>
			</div>
		</form>
	</div>
</div>

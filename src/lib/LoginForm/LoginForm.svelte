<script lang="ts">
	let message: string = '';
	let isLoading = false;

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		isLoading = true;
		message = '';

		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);

		try {
			const response = await fetch('/login', {
				method: 'POST',
				body: formData
			});

			const data = await response.json();

			if (!response.ok) {
				message = data.message || 'Login failed';
				isLoading = false;
				return;
			}

			window.location.href = '/search';
		} catch (error) {
			console.error(error);
			message = 'An error occurred during login';
			isLoading = false;
		}
	}
</script>

<div class="flex items-center justify-center">
	<div class="w-full max-w-md rounded-md bg-white p-6 shadow-md">
		<h1 class="mb-6 text-center text-2xl font-bold">Login</h1>
		<form on:submit={handleSubmit} class="space-y-4">
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

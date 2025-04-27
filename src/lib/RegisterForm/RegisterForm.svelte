<script lang="ts">
	import { goto } from '$app/navigation';
	let name: string = '';
	let email: string = '';
	let password: string = '';
	let message: string = '';

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		const target = event.target as HTMLFormElement;
		if (!target.checkValidity()) {
			return;
		}

		try {
			const formData = new FormData(target);
			const res = await fetch('/register', {
				method: 'POST',
				body: formData
			});
			const data = await res.json();

			message = data.message;

			if (res.ok) {
				await goto('/login');
			}
		} catch (error) {
			console.error(error);
			message = 'Internal Server Error';
		}
	}
</script>

<div class="flex h-full items-center justify-center">
	<div class="w-full max-w-md rounded-md bg-white p-6 shadow-md">
		<h1 class="mb-6 text-center text-2xl font-bold">Register</h1>
		<form data-testid="register-form" class="space-y-4" on:submit={handleSubmit}>
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
					class="w-full rounded-md bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				>
					Register
				</button>
			</div>
		</form>
		{#if message}
			<p class="mt-4 text-center text-lg">{message}</p>
		{/if}
	</div>
</div>

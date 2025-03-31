<script lang="ts">
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
			const res = await fetch('/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, password })
			});

			if (res.ok) {
				message = 'welcome';
				window.location.href = '/search';
			} else if (res.status === 401) {
				message = 'invalid credentials';
			} else {
				message = 'login failed';
			}
		} catch (error) {
			console.error(error);
			message = 'login failed';
		}
	}
</script>

<div class="flex items-center justify-center">
	<div class="w-full max-w-md rounded-md bg-white p-6 shadow-md">
		<h1 class="mb-6 text-center text-2xl font-bold">Login</h1>
		<form class="space-y-4" on:submit={handleSubmit}>
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
					class="w-full rounded-md bg-sky-300 px-4 py-2 font-semibold text-white hover:bg-sky-400 focus:ring-2 focus:ring-sky-600 focus:outline-none"
				>
					Login
				</button>
			</div>
		</form>
		{#if message}
			<p class="mt-4 text-center text-lg">{message}</p>
		{/if}
	</div>
</div>

<script lang="ts">
	import { goto } from '$app/navigation';

	export let user;
	export let currentPath;

	async function handleLogout() {
		try {
			const formData = new FormData();
			const response = await fetch('/logout', {
				method: 'POST',
				body: formData
			});
			if (response.ok) {
				await goto('/');
			}
		} catch (error) {
			console.error('Logout error:', error);
		}
	}
</script>

<nav
	class="fixed top-0 right-0 left-0 z-50 flex h-16 items-center border-b border-gray-200 bg-white px-6 font-serif"
>
	<!-- Left Column -->
	<div class="flex-1">
		{#if !user && currentPath !== '/register' && currentPath !== '/login' && currentPath !== '/search'}
			<a href="/register">
				<button class="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">
					Register
				</button>
			</a>
		{/if}
	</div>

	<!-- Center Column -->
	<div>
		<span class="font-semibold text-gray-700">PantryChef</span>
	</div>

	<!-- Right Column -->
	<div class="flex flex-1 items-center justify-end">
		{#if user}
			<button
				on:click={handleLogout}
				class="ml-4 rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
			>
				Logout
			</button>
		{:else if currentPath !== '/register' && currentPath !== '/login' && currentPath !== '/search'}
			<a href="/login" class="text-gray-700 hover:text-gray-900">Sign in</a>
		{/if}
	</div>
</nav>

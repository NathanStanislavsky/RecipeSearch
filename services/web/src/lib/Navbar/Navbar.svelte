<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { goto } from '$app/navigation';

	export let user;
	export let currentPath;

	const handleLogout: SubmitFunction = () => {
		return async ({ result, update }) => {
			if (result.type === 'redirect') {
				// Handle redirect manually to avoid navigation intent issues
				goto(result.location, { replaceState: true });
				return;
			} else {
				await update();
			}
		};
	};
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
		{#if user && currentPath !== '/recommend'}
			<a href="/recommend">
				<button class="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">
					Recommend
				</button>
			</a>
		{/if}
		{#if currentPath == '/recommend'}
			<a href="/search">
				<button class="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">
					Search
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
			<form method="POST" action="/logout" use:enhance={handleLogout} class="inline">
				<button
					type="submit"
					class="ml-4 rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
				>
					Logout
				</button>
			</form>
		{:else if currentPath !== '/register' && currentPath !== '/login' && currentPath !== '/search'}
			<a href="/login" class="text-gray-700 hover:text-gray-900">Sign in</a>
		{/if}
	</div>
</nav>

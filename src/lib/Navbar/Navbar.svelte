<script>
	import { page } from '$app/stores';
	export let user = $page.data?.user;
</script>

<nav class="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
	<div>
		{#if !user}
			<a href="/signup">
				<button class="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">
					Register
				</button>
			</a>
		{/if}
	</div>

	<div class="flex items-center space-x-2">
		<span class="font-semibold text-gray-700">PantryChef</span>
	</div>

	<div class="flex items-center space-x-6">
		{#if !user}
			<a href="/signin" class="text-gray-700 hover:text-gray-900"> Sign in </a>
		{/if}
	</div>
</nav>

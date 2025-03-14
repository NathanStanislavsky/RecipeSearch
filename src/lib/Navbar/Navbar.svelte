<script>
	import { page } from '$app/stores';
	export let user = $page.data?.user;
</script>

<nav class="fixed top-0 left-0 right-0 z-50 flex h-16 items-center border-b border-gray-200 bg-white px-6 font-serif">
	<!-- Left Column -->
	<div class="flex-1">
		{#if !user}
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
	<div class="flex-1 flex justify-end items-center">
		{#if !user}
			<a href="/login" class="text-gray-700 hover:text-gray-900">
				Sign in
			</a>
		{/if}
	</div>
</nav>
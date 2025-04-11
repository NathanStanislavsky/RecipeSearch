<script lang="ts">
	import type { Recipe } from '../../types/recipe.js';

	export let recipe: Recipe;
	export let loading = false;
</script>

<div
	class="max-w-sm overflow-hidden rounded bg-white shadow-lg transition-transform hover:scale-105"
	role="article"
	aria-label="Recipe card for {recipe.title}"
>
	{#if loading}
		<div data-testid="loading-placeholder" class="h-48 w-full animate-pulse bg-gray-200"></div>
	{:else}
		<img
			class="h-48 w-full object-cover"
			src={recipe.image}
			alt={`Image of ${recipe.title}`}
			loading="lazy"
		/>
	{/if}
	<div class="px-6 py-4">
		<h2 class="mb-2 text-xl font-bold text-gray-900">{recipe.title}</h2>
		<p class="text-base text-gray-700">
			Ready in <span class="font-semibold">{recipe.readyInMinutes} minutes</span>
		</p>
		<p class="text-base text-gray-700">{recipe.servings} servings</p>
	</div>
	<div class="px-6 pt-4 pb-6">
		<a
			href={recipe.sourceUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="block rounded bg-blue-500 px-4 py-2 text-center font-bold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
			aria-label="View recipe for {recipe.title}"
		>
			View Recipe
		</a>
	</div>
</div>

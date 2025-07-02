<script lang="ts">
	import type { TransformedRecipe } from '../../types/recipe.js';
	import RecipeDetailView from '../RecipeDetailView/RecipeDetailView.svelte';

	export let recipe: TransformedRecipe;
</script>

<div
	class="max-w-sm overflow-hidden rounded-lg bg-white shadow-lg transition-transform hover:scale-105"
	role="article"
	aria-label="Recipe card for {recipe.name}"
>
	<div class="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
		<h2 class="text-xl font-bold capitalize">{recipe.name}</h2>
		<p class="text-blue-100">
			<span class="font-semibold">{recipe.minutes}</span> minutes
		</p>
	</div>

	<div class="px-6 py-4">
		<div class="mb-4">
			<h3 class="mb-2 text-sm font-semibold tracking-wide text-gray-700 uppercase">Description</h3>
			<p class="text-sm leading-relaxed text-gray-600">{recipe.description}</p>
		</div>

		<RecipeDetailView {recipe} />
	</div>
</div>

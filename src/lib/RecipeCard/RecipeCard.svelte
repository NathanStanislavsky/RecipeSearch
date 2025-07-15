<script lang="ts">
	import type { TransformedRecipe } from '../../types/recipe.js';
	import RatingDisplay from '$lib/RatingDisplay/RatingDisplay.svelte';
	import RecipeDetailView from '$lib/RecipeDetailView/RecipeDetailView.svelte';
	import BaseModal from '$lib/BaseModal/BaseModal.svelte';

	export let recipe: TransformedRecipe;

	let showModal = false;
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

		<button
			onclick={() => (showModal = true)}
			class="w-full rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
		>
			View Recipe Details
		</button>
	</div>

	<div class="px-6 py-4">
		<RatingDisplay selectedRating={recipe.userRating} recipeId={recipe.id} />
	</div>
</div>

<BaseModal bind:isOpen={showModal} title={recipe.name}>
	<RecipeDetailView {recipe} />
</BaseModal>

<script lang="ts">
	import RecipeCard from '$lib/RecipeCard/RecipeCard.svelte';
	import type { Recipe } from '../../types/recipe.js';

	export let recipes: Recipe[];
</script>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
	{#each recipes as recipe}
		<RecipeCard {recipe} />
	{/each}
</div>

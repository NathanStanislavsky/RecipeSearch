<script lang="ts">
	import RecipeCard from '$lib/RecipeCard/RecipeCard.svelte';
	export let recipes: Array<{
		image: string;
		title: string;
		readyInMinutes: number;
		servings: number;
		sourceUrl: string;
	}>;
</script>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
	{#each recipes as recipe}
		<RecipeCard {recipe} />
	{/each}
</div>

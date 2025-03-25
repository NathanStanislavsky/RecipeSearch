<script lang="ts">
	import RecipeCard from '$lib/RecipeCard/RecipeCard.svelte';

	export let user;

	export let recipes: Array<{
		id: number;
		image: string;
		title: string;
		readyInMinutes: number;
		servings: number;
		sourceUrl: string;
	}>;
</script>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
	{#each recipes as recipe}
		<RecipeCard {recipe} user={user} />
	{/each}
</div>

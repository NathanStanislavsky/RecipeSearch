<script lang="ts">
	import SearchButton from '$lib/SearchButton/SearchButton.svelte';
	import SearchBar from '$lib/SearchBar/SearchBar.svelte';
	import RecipeCardParent from '$lib/RecipeCardParent/RecipeCardParent.svelte';

	let ingredients = '';
	let recipes: Array<{
		image: string;
		title: string;
		readyInMinutes: number;
		servings: number;
		sourceUrl: string;
	}> = [];

	async function searchRecipes() {
		try {
			if (!ingredients) {
				console.error('No ingredients provided');
				return;
			}

			const response = await fetch(`/searchRecipes?ingredients=${ingredients}`);
			const data = await response.json();

			recipes = data;
		} catch (error) {
			console.error('Error fetching recipes:', error);
		}
	}
</script>

<div class="flex min-h-screen flex-col items-center bg-green-100 pt-20 font-serif">
	<div class="w-full max-w-4xl mb-10 text-center">
		<h1 class="text-4xl mb-4">What is in your fridge?</h1>
		<SearchBar bind:ingredients />
		<SearchButton onClick={searchRecipes} />
	</div>

	{#if recipes.length > 0}
		<div class="w-full max-w-4xl px-4">
			<RecipeCardParent {recipes} />
		</div>
	{/if}
</div>
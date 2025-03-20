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

	let isLoading = false;
	let hasSearched = false;

	async function searchRecipes() {
		try {
			if (!ingredients) {
				console.error('No ingredients provided');
				return;
			}

			isLoading = true;
			hasSearched = true;
			const response = await fetch(`/searchRecipes?ingredients=${ingredients}`);
			const data = await response.json();
			recipes = data;
		} catch (error) {
			console.error('Error fetching recipes:', error);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex min-h-screen flex-col items-center bg-slate-100 pt-20 font-serif">
	<div class="mb-10 w-full max-w-4xl text-center">
		<h1 class="mb-4 text-4xl">What is in your fridge?</h1>
		<SearchBar bind:ingredients />
		<SearchButton onClick={searchRecipes} />
	</div>

	{#if isLoading}
		<p>Loading...</p>
	{:else if recipes.length > 0}
		<div class="w-full max-w-4xl px-4">
			<RecipeCardParent {recipes} />
		</div>
	{:else if hasSearched}
		<p>No results</p>
	{/if}
</div>

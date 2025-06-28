<script lang="ts">
	import SearchButton from '$lib/SearchButton/SearchButton.svelte';
	import SearchBar from '$lib/SearchBar/SearchBar.svelte';
	import RecipeCardParent from '$lib/RecipeCardParent/RecipeCardParent.svelte';
	import type { Recipe } from '../../types/recipe.ts';
	import Navbar from '$lib/Navbar/Navbar.svelte';
	let ingredients = '';
	let recipes: Recipe[] = [];

	let isLoading = false;
	let hasSearched = false;
	let searchError = '';

	async function searchRecipes() {
		try {
			if (!ingredients) {
				console.error('No ingredients provided');
				return;
			}

			isLoading = true;
			hasSearched = true;
			searchError = '';

			const response = await fetch(`/search?ingredients=${encodeURIComponent(ingredients)}`);

			if (!response.ok) {
				throw new Error(`Search failed: ${response.statusText}`);
			}

			const data = await response.json();

			console.log('Search response:', data);

			// Handle the new API response format
			if (data.results) {
				recipes = data.results;
			} else if (Array.isArray(data)) {
				// Fallback for direct array response
				recipes = data;
			} else {
				recipes = [];
			}
		} catch (error) {
			console.error('Error fetching recipes:', error);
			searchError = error instanceof Error ? error.message : 'An error occurred during search';
			recipes = [];
		} finally {
			isLoading = false;
		}
	}
</script>

<Navbar user={true} currentPath={'/search'} />

<div class="flex min-h-screen flex-col items-center bg-slate-100 pt-20 font-serif">
	<div class="mb-10 w-full max-w-4xl text-center">
		<h1 class="mb-4 text-4xl">What is in your fridge?</h1>
		<SearchBar bind:ingredients />
		<SearchButton onClick={searchRecipes} />
	</div>

	{#if isLoading}
		<p>Loading...</p>
	{:else if searchError}
		<div class="text-center text-red-600">
			<p>Error: {searchError}</p>
		</div>
	{:else if recipes.length > 0}
		<div class="w-full max-w-4xl px-4">
			<RecipeCardParent {recipes} />
		</div>
	{:else if hasSearched}
		<p>No results</p>
	{/if}
</div>

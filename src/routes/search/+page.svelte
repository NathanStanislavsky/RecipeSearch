<script lang="ts">
	import SearchButton from '$lib/SearchButton/SearchButton.svelte';
	import SearchBar from '$lib/SearchBar/SearchBar.svelte';
	import RecipeCardParent from '$lib/RecipeCardParent/RecipeCardParent.svelte';
	import type { Recipe } from '../../types/recipe.ts';
	import Navbar from '$lib/Navbar/Navbar.svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	let ingredients = '';
	let recipes: Recipe[] = [];
	let isLoading = false;
	let hasSearched = false;
	let searchError = '';

	const handleSearch: SubmitFunction = () => {
		if (!ingredients) {
			console.error('No ingredients provided');
			return;
		}

		isLoading = true;
		hasSearched = true;
		searchError = '';

		return async ({ result, update }) => {
			isLoading = false;

			if (result.type === 'success' && result.data) {
				const data = result.data as { results: Recipe[]; total: number; query: string };
				console.log('Search response:', data);
				recipes = data.results || [];
			} else if (result.type === 'failure') {
				searchError = result.data?.message || 'Search failed';
				recipes = [];
			} else {
				searchError = 'An unexpected error occurred';
				recipes = [];
			}

			await update();
		};
	};
</script>

<Navbar user={true} currentPath={'/search'} />

<div class="flex min-h-screen flex-col items-center bg-slate-100 pt-20 font-serif">
	<div class="mb-10 w-full max-w-4xl text-center">
		<h1 class="mb-4 text-4xl">What is in your fridge?</h1>
		
		<form method="POST" action="?/search" use:enhance={handleSearch}>
			<SearchBar bind:ingredients />
			<input type="hidden" name="ingredients" bind:value={ingredients} />
			<SearchButton />
		</form>
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

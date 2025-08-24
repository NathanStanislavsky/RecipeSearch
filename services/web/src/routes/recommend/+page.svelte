<script lang="ts">
	import type { PageData } from './$types.js';
	import RecipeCardParent from '$lib/RecipeCardParent/RecipeCardParent.svelte';
	import Navbar from '$lib/Navbar/Navbar.svelte';
	import { writable, derived } from 'svelte/store';
	export let data: PageData;

	const searchQuery = writable('');
	const cookingTimeFilter = writable('all');
	const ratingFilter = writable('all');
	const sortBy = writable('score');

	const filteredRecommendations = derived(
		[searchQuery, cookingTimeFilter, ratingFilter, sortBy],
		([$searchQuery, $cookingTimeFilter, $ratingFilter, $sortBy]) => {
			let filtered = data.recommendations;

			if ($searchQuery.trim()) {
				const query = $searchQuery.toLowerCase();
				filtered = filtered.filter(
					(recipe) =>
						recipe.name.toLowerCase().includes(query) ||
						recipe.ingredients.toLowerCase().includes(query) ||
						recipe.description.toLowerCase().includes(query)
				);
			}

			if ($cookingTimeFilter !== 'all') {
				filtered = filtered.filter((recipe) => {
					const minutes = recipe.minutes;
					switch ($cookingTimeFilter) {
						case 'quick':
							return minutes <= 30;
						case 'medium':
							return minutes > 30 && minutes <= 60;
						case 'long':
							return minutes > 60;
						default:
							return true;
					}
				});
			}

			if ($ratingFilter !== 'all') {
				filtered = filtered.filter((recipe) => {
					const rating = recipe.userRating || 0;
					switch ($ratingFilter) {
						case 'rated':
							return rating > 0;
						case 'unrated':
							return rating === 0 || rating === undefined;
						case 'high':
							return rating >= 4;
						case 'low':
							return rating <= 2 && rating > 0;
						default:
							return true;
					}
				});
			}

			filtered = [...filtered].sort((a, b) => {
				switch ($sortBy) {
					case 'name':
						return a.name.localeCompare(b.name);
					case 'time':
						return a.minutes - b.minutes;
					case 'rating':
						return (b.userRating || 0) - (a.userRating || 0);
					case 'score':
					default:
						return 0;
				}
			});

			return filtered;
		}
	);

	function resetFilters() {
		searchQuery.set('');
		cookingTimeFilter.set('all');
		ratingFilter.set('all');
		sortBy.set('score');
	}
</script>

<Navbar user={true} currentPath={'/recommend'} />

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 pb-8">
	<div class="container mx-auto px-4 sm:px-6 lg:px-8">
		{#if data.recommendations.length > 0}
			<!-- Filters Section -->
			<div class="mb-8 rounded-lg bg-white p-6 shadow-sm">
				<div class="mb-4 flex flex-wrap items-center justify-between gap-4">
					<h3 class="text-lg font-semibold text-gray-800">Filter & Sort</h3>
					<button
						on:click={resetFilters}
						class="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
					>
						Reset Filters
					</button>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<!-- Search Filter -->
					<div>
						<label for="search" class="block text-sm font-medium text-gray-700 mb-2">Search</label>
						<input
							id="search"
							type="text"
							bind:value={$searchQuery}
							placeholder="Search recipes..."
							class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>

					<!-- Cooking Time Filter -->
					<div>
						<label for="cookingTime" class="block text-sm font-medium text-gray-700 mb-2">Cooking Time</label>
						<select
							id="cookingTime"
							bind:value={$cookingTimeFilter}
							class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						>
							<option value="all">All Times</option>
							<option value="quick">Quick (≤30 min)</option>
							<option value="medium">Medium (31-60 min)</option>
							<option value="long">Long (>60 min)</option>
						</select>
					</div>

					<!-- Rating Filter -->
					<div>
						<label for="rating" class="block text-sm font-medium text-gray-700 mb-2">Rating</label>
						<select
							id="rating"
							bind:value={$ratingFilter}
							class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						>
							<option value="all">All Ratings</option>
							<option value="rated">Rated</option>
							<option value="unrated">Unrated</option>
							<option value="high">High (4-5 stars)</option>
							<option value="low">Low (1-2 stars)</option>
						</select>
					</div>

					<!-- Sort By -->
					<div>
						<label for="sortBy" class="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
						<select
							id="sortBy"
							bind:value={$sortBy}
							class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						>
							<option value="score">Recommended Order</option>
							<option value="name">Name A-Z</option>
							<option value="time">Cooking Time</option>
							<option value="rating">Rating</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Results Section -->
			<div class="mb-6">
				<div class="mb-6 flex items-center justify-between">
					<h2 class="text-2xl font-semibold text-gray-800">
						Recommended for You
						{#if $filteredRecommendations.length !== data.recommendations.length}
							<span class="ml-2 text-lg font-normal text-gray-500">
								({$filteredRecommendations.length} of {data.recommendations.length})
							</span>
						{/if}
					</h2>
					<div class="flex items-center space-x-2 text-sm text-gray-500">
						<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						<span>{$filteredRecommendations.length} recipe{$filteredRecommendations.length === 1 ? '' : 's'} found</span>
					</div>
				</div>

				{#if $filteredRecommendations.length > 0}
					<RecipeCardParent recipes={$filteredRecommendations} />
				{:else}
					<div class="py-12 text-center">
						<div class="mx-auto mb-4 h-16 w-16 text-gray-400">
							<svg fill="currentColor" viewBox="0 0 24 24">
								<path d="M9,2A1,1 0 0,0 8,3V4.06C5.72,4.92 4,7.17 4,10V16L2,18V19H22V18L20,16V10C20,7.17 18.28,4.92 16,4.06V3A1,1 0 0,0 15,2H9M9,4H15V4.06C16.67,4.86 18,6.76 18,9V16H6V9C6,6.76 7.33,4.86 9,4.06V4M9,20V21H15V20H9Z" />
							</svg>
						</div>
						<h3 class="mb-2 text-lg font-medium text-gray-900">No recipes match your filters</h3>
						<p class="text-gray-600">Try adjusting your search criteria or reset the filters.</p>
					</div>
				{/if}
			</div>
		{:else}
			<div class="py-16 text-center">
				<div class="mx-auto mb-6 h-24 w-24 text-gray-400">
					<svg fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M7,9.5C7,8.7 7.7,8 8.5,8C9.3,8 10,8.7 10,9.5C10,10.3 9.3,11 8.5,11C7.7,11 7,10.3 7,9.5M14,9.5C14,8.7 14.7,8 15.5,8C16.3,8 17,8.7 17,9.5C17,10.3 16.3,11 15.5,11C14.7,11 14,10.3 14,9.5M12,17.23C10.25,17.23 8.71,16.5 7.81,15.42L9.23,14C9.68,14.72 10.75,15.23 12,15.23C13.25,15.23 14.32,14.72 14.77,14L16.19,15.42C15.29,16.5 13.75,17.23 12,17.23Z"
						/>
					</svg>
				</div>
				<h3 class="mb-2 text-xl font-medium text-gray-900">No Recommendations Yet</h3>
				<p class="mx-auto mb-8 max-w-sm text-gray-600">
					We're still learning about your preferences. Try rating some recipes or searching for
					ingredients to get personalized recommendations!
				</p>
				<div class="space-y-3 sm:flex sm:justify-center sm:space-y-0 sm:space-x-3">
					<a
						href="/search"
						class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
					>
						<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
						Search Recipes
					</a>
				</div>
			</div>
		{/if}
	</div>
</div>

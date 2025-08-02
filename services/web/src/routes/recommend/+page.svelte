<script lang="ts">
	import type { PageData } from './$types.js';
	import RecipeCardParent from '$lib/RecipeCardParent/RecipeCardParent.svelte';

	export let data: PageData;
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
	<div class="container mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center mb-12">
			<h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
				Your Personalized 
				<span class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
					Recipe Recommendations
				</span>
			</h1>
			<p class="text-lg text-gray-600 max-w-2xl mx-auto">
				Discover recipes tailored just for you, based on your taste preferences and cooking history
			</p>
		</div>

		{#if data.recommendations.length > 0}
			<div class="mb-6">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-2xl font-semibold text-gray-800">
						Recommended for You
					</h2>
					<div class="flex items-center space-x-2 text-sm text-gray-500">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
						</svg>
						<span>{data.recommendations.length} recipe{data.recommendations.length === 1 ? '' : 's'} found</span>
					</div>
				</div>
				
				<RecipeCardParent recipes={data.recommendations} />
			</div>
		{:else}
			<div class="text-center py-16">
				<div class="mx-auto h-24 w-24 text-gray-400 mb-6">
					<svg fill="currentColor" viewBox="0 0 24 24">
						<path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M7,9.5C7,8.7 7.7,8 8.5,8C9.3,8 10,8.7 10,9.5C10,10.3 9.3,11 8.5,11C7.7,11 7,10.3 7,9.5M14,9.5C14,8.7 14.7,8 15.5,8C16.3,8 17,8.7 17,9.5C17,10.3 16.3,11 15.5,11C14.7,11 14,10.3 14,9.5M12,17.23C10.25,17.23 8.71,16.5 7.81,15.42L9.23,14C9.68,14.72 10.75,15.23 12,15.23C13.25,15.23 14.32,14.72 14.77,14L16.19,15.42C15.29,16.5 13.75,17.23 12,17.23Z" />
					</svg>
				</div>
				<h3 class="text-xl font-medium text-gray-900 mb-2">No Recommendations Yet</h3>
				<p class="text-gray-600 mb-8 max-w-sm mx-auto">
					We're still learning about your preferences. Try rating some recipes or searching for ingredients to get personalized recommendations!
				</p>
				<div class="space-y-3 sm:space-y-0 sm:space-x-3 sm:flex sm:justify-center">
					<a 
						href="/search" 
						class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
					>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
						Search Recipes
					</a>
					<a 
						href="/" 
						class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
					>
						Browse All Recipes
					</a>
				</div>
			</div>
		{/if}
	</div>
</div>
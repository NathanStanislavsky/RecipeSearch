<script lang="ts">
	import type { Recipe } from '../../types/recipe.js';

	export let recipe: Recipe;
</script>

<div class="max-w-sm overflow-hidden rounded bg-white shadow-lg">
	<img class="h-48 w-full object-cover" src={recipe.image} alt={recipe.title} />
	<div class="px-6 py-4">
		<h2 class="mb-2 text-xl font-bold">{recipe.title}</h2>
		<p class="text-base text-gray-700">
			Ready in <span class="font-semibold">{recipe.readyInMinutes} minutes</span>
		</p>
		<p class="text-base text-gray-700">{recipe.servings} servings</p>
	</div>
	<div class="px-6 pt-4 pb-6">
		<a
			href={recipe.sourceUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="block rounded bg-blue-500 px-4 py-2 text-center font-bold text-white hover:bg-blue-700"
		>
			View Recipe
		</a>
	</div>
</div>

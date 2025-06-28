<script lang="ts">
	import type { TransformedRecipe } from '../../types/recipe.js';

	export let recipe: TransformedRecipe;
</script>

<div
	class="max-w-sm overflow-hidden rounded bg-white shadow-lg transition-transform hover:scale-105"
	role="article"
	aria-label="Recipe card for {recipe.name}"
>
	<div class="px-6 py-4">
		<h2 class="mb-2 text-xl font-bold text-gray-900">{recipe.name}</h2>
		<p class="text-base text-gray-700">
			Ready in <span class="font-semibold">{recipe.minutes} minutes</span>
		</p>
	</div>
</div>

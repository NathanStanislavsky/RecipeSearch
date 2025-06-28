<script lang="ts">
	import type { TransformedRecipe } from '../../types/recipe.js';

	export let recipe: TransformedRecipe;

	function parseJsonString(jsonString: string): any[] {
		try {
			return JSON.parse(jsonString.replace(/'/g, '"'));
		} catch {
			return [];
		}
	}

	function parseNutrition(nutritionString: string): { 
		calories: number; 
		totalFat: number; 
		sugar: number; 
		sodium: number; 
		protein: number; 
		saturatedFat: number; 
		carbs: number; 
	} {
		try {
			const values = JSON.parse(nutritionString);
			return {
				calories: Math.round(values[0] || 0),
				totalFat: Math.round(values[1] || 0),
				sugar: Math.round(values[2] || 0),
				sodium: Math.round(values[3] || 0),
				protein: Math.round(values[4] || 0),
				saturatedFat: Math.round(values[5] || 0),
				carbs: Math.round(values[6] || 0)
			};
		} catch {
			return { calories: 0, totalFat: 0, sugar: 0, sodium: 0, protein: 0, saturatedFat: 0, carbs: 0 };
		}
	}

	$: parsedSteps = parseJsonString(recipe.steps);
	$: parsedIngredients = parseJsonString(recipe.ingredients);
	$: nutritionInfo = parseNutrition(recipe.nutrition);
</script>

<div
	class="max-w-sm overflow-hidden rounded-lg bg-white shadow-lg transition-transform hover:scale-105"
	role="article"
	aria-label="Recipe card for {recipe.name}"
>
	<div class="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
		<h2 class="text-xl font-bold capitalize">{recipe.name}</h2>
		<p class="text-blue-100">
			<span class="font-semibold">{recipe.minutes}</span> minutes
		</p>
	</div>

	<div class="px-6 py-4">
		<div class="mb-4">
			<h3 class="mb-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">Description</h3>
			<p class="text-sm text-gray-600 leading-relaxed">{recipe.description}</p>
		</div>

		<div class="mb-4">
			<h3 class="mb-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">Nutrition</h3>
			<div class="grid grid-cols-2 gap-2 text-xs">
				<div class="bg-gray-50 rounded px-2 py-1">
					<span class="font-medium">Calories:</span> {nutritionInfo.calories}
				</div>
				<div class="bg-gray-50 rounded px-2 py-1">
					<span class="font-medium">Protein:</span> {nutritionInfo.protein}% DV
				</div>
				<div class="bg-gray-50 rounded px-2 py-1">
					<span class="font-medium">Total Fat:</span> {nutritionInfo.totalFat}% DV
				</div>
				<div class="bg-gray-50 rounded px-2 py-1">
					<span class="font-medium">Sat. Fat:</span> {nutritionInfo.saturatedFat}% DV
				</div>
				<div class="bg-gray-50 rounded px-2 py-1">
					<span class="font-medium">Sugar:</span> {nutritionInfo.sugar}% DV
				</div>
				<div class="bg-gray-50 rounded px-2 py-1">
					<span class="font-medium">Sodium:</span> {nutritionInfo.sodium}% DV
				</div>
			</div>
		</div>

		<div class="mb-4">
			<h3 class="mb-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">Ingredients</h3>
			<ul class="text-sm text-gray-600 space-y-1">
				{#each parsedIngredients as ingredient}
					<li class="flex items-start">
						<span class="text-blue-500 mr-2">•</span>
						<span class="capitalize">{ingredient}</span>
					</li>
				{/each}
			</ul>
		</div>

		<div class="mb-4">
			<h3 class="mb-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">Instructions</h3>
			<ol class="text-sm text-gray-600 space-y-2">
				{#each parsedSteps as step, index}
					<li class="flex items-start">
						<span class="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
							{index + 1}
						</span>
						<span class="capitalize leading-relaxed">{step}</span>
					</li>
				{/each}
			</ol>
		</div>
	</div>
</div>

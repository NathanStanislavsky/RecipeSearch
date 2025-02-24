<script lang="ts">
	export let recipe: {
		image: string;
		title: string;
		readyInMinutes: number;
		servings: number;
		sourceUrl: string;
	};
</script>

<div class="max-w-sm rounded overflow-hidden shadow-lg bg-white">
	<img class="w-full h-48 object-cover" src={recipe.image} alt={recipe.title} />
	<div class="px-6 py-4">
		<h2 class="font-bold text-xl mb-2">{recipe.title}</h2>
		<p class="text-gray-700 text-base">Ready in <span class="font-semibold">{recipe.readyInMinutes} minutes</span></p>
		<p class="text-gray-700 text-base">{recipe.servings} servings</p>
	</div>
	<div class="px-6 pt-4 pb-6">
		<a
			href={recipe.sourceUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="block text-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
		>
			View Recipe
		</a>
	</div>
</div>
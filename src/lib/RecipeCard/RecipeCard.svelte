<script lang="ts">
	import Icon from '@iconify/svelte';
	import starOutline from '@iconify-icons/mdi/star-outline';
	import star from '@iconify-icons/mdi/star';

	export let recipe: {
		id: number;
		image: string;
		title: string;
		readyInMinutes: number;
		servings: number;
		sourceUrl: string;
	};

	let isFavorited = false;

	async function toggleFavorite() {
		isFavorited = !isFavorited;
	}
</script>

<div class="relative max-w-sm overflow-hidden rounded bg-white shadow-lg">
	<button on:click={toggleFavorite} class="absolute top-2 right-2 rounded-full bg-white p-2 shadow">
		<Icon
			data-testid="favorite-icon"
			icon={isFavorited ? star : starOutline}
			width="24"
			height="24"
		/>
	</button>

	<!-- Recipe Card Content -->
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

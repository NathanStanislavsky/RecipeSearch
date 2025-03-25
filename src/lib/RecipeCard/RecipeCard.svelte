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

	export let user: { userId: number; email: string; iat: number; exp: number } | null;
	const userId = user ? user.userId : null;

	let isFavorited = false;

	async function toggleFavorite() {
		if (!userId) {
			console.error('User is not logged in');
			return;
		}

		// Determine the endpoint, method, and payload based on the favorite state.
		const { endpoint, method, payload } = !isFavorited
			? {
					endpoint: '/favorites/addFavorite',
					method: 'POST',
					payload: { userId, recipeData: recipe }
				}
			: {
					endpoint: '/favorites/deleteFavorite',
					method: 'DELETE',
					payload: { userId, recipeId: recipe.id }
				};

		try {
			const response = await fetch(endpoint, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (response.ok) {
				isFavorited = !isFavorited;
			} else {
				console.error(`Failed to ${!isFavorited ? 'add' : 'remove'} favorite`);
			}
		} catch (error) {
			console.error(`Error ${!isFavorited ? 'adding' : 'removing'} favorite:`, error);
		}
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

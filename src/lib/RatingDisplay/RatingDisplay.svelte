<script lang="ts">
	const { selectedRating, recipeId } = $props<{
		selectedRating?: number;
		recipeId: number;
	}>();
	
	let hoveredRating: number | null = $state(null);
	let currentRating: number = $state(selectedRating || 0);
	
	async function submitRating(rating: number) {
		try {
			const response = await fetch('/ratings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					recipeId: recipeId.toString(),
					rating: rating
				})
			});
			
			if (response.ok) {
				currentRating = rating;
			}
		} catch (error) {
			console.error('Error submitting rating:', error);
		}
	}
</script>

<div class="flex items-center">
	{#each Array(5) as _, index}
		<button
			type="button"
			class="p-1 transition-colors hover:scale-110 focus:outline-none"
			onmouseenter={() => {
				hoveredRating = index + 1;
			}}
			onmouseleave={() => {
				hoveredRating = null;
			}}
			onclick={() => {
				submitRating(index + 1);
			}}
			aria-label="Rate {index + 1} stars"
		>
			{#if index < (hoveredRating || currentRating)}
				<!-- Full star -->
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="text-yellow-400">
					<path fill="currentColor" d="m5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275z"/>
				</svg>
			{:else}
				<!-- Empty star -->
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="text-gray-300">
					<path fill="currentColor" d="m8.85 16.825l3.15-1.9l3.15 1.925l-.825-3.6l2.775-2.4l-3.65-.325l-1.45-3.4l-1.45 3.375l-3.65.325l2.775 2.425zM5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275zM12 12.25"/>
				</svg>
			{/if}
		</button>
	{/each}
</div>
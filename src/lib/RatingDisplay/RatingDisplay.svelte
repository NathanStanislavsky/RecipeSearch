<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	const { selectedRating, recipeId } = $props<{
		selectedRating?: number;
		recipeId: number;
	}>();

	let hoveredRating: number | null = $state(null);
	let currentRating: number = $state(selectedRating || 0);
	let ratingForm: HTMLFormElement;
	let ratingInput: HTMLInputElement;
	let isSubmitting = $state(false);

	const handleRatingSubmit: SubmitFunction = () => {
		isSubmitting = true;
		return async ({ result, update }) => {
			if (result.type === 'success' && result.data) {
				const data = result.data as { rating: string };
				currentRating = Number(data.rating);
			} else if (result.type === 'failure') {
				console.error('Failed to submit rating:', result.data?.message);
			}
			isSubmitting = false;
			await update();
		};
	};

	function submitRating(rating: number) {
		if (isSubmitting) return;
		ratingInput.value = rating.toString();
		ratingForm.requestSubmit();
	}
</script>

<form
	bind:this={ratingForm}
	method="POST"
	action="?/addRating"
	use:enhance={handleRatingSubmit}
	class="hidden"
>
	<input type="hidden" name="recipeId" value={recipeId.toString()} />
	<input bind:this={ratingInput} type="hidden" name="rating" value="" />
</form>

<div class="flex items-center">
	{#each Array.from({ length: 5 }, (_, index) => index) as index}
		{@const starNumber = index + 1}
		{@const isActive = starNumber <= (hoveredRating || currentRating)}

		<button
			type="button"
			class="p-1 transition-colors hover:scale-110 focus:outline-none disabled:opacity-50"
			disabled={isSubmitting}
			onmouseenter={() => (hoveredRating = starNumber)}
			onmouseleave={() => (hoveredRating = null)}
			onclick={() => submitRating(starNumber)}
			aria-label="Rate {starNumber} stars"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				class={isActive ? 'text-yellow-400' : 'text-gray-300'}
			>
				{#if isActive}
					<path
						fill="currentColor"
						d="m5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275z"
					/>
				{:else}
					<path
						fill="currentColor"
						d="m8.85 16.825l3.15-1.9l3.15 1.925l-.825-3.6l2.775-2.4l-3.65-.325l-1.45-3.4l-1.45 3.375l-3.65.325l2.775 2.425zM5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275zM12 12.25"
					/>
				{/if}
			</svg>
		</button>
	{/each}
</div>

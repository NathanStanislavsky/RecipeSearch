<script lang="ts">
	export let rating: number;
</script>

<div class="flex items-center">
	<div class="flex items-center">
		{#each Array(Math.ceil(rating)) as _, index}
			{#if index < Math.floor(rating)}
				<!-- Full star -->
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="text-yellow-400">
					<path fill="currentColor" d="m5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275z"/>
				</svg>
			{:else}
				<!-- Empty star -->
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="text-yellow-400">
					<path fill="currentColor" d="m8.85 16.825l3.15-1.9l3.15 1.925l-.825-3.6l2.775-2.4l-3.65-.325l-1.45-3.4l-1.45 3.375l-3.65.325l2.775 2.425zM5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275zM12 12.25"/>
				</svg>
			{/if}
		{/each}
	</div>
</div>
<script lang="ts">
	import { onMount } from 'svelte';

	export let isOpen = false;
	export let title = '';
	export let maxWidth = 'max-w-2xl';

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isOpen = false;
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			isOpen = false;
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	$: if (isOpen) {
		document.body.style.overflow = 'hidden';
	} else {
		document.body.style.overflow = 'auto';
	}
</script>

{#if isOpen}
	<!-- Modal Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
		onclick={handleBackdropClick}
		role="presentation"
	>
		<!-- Modal Content -->
		<div
			class="relative max-h-[90vh] w-full {maxWidth} overflow-y-auto rounded-lg bg-white shadow-xl"
			role="document"
		>
			<!-- Modal Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<h2 id="modal-title" class="text-xl font-bold text-gray-900">
					{title}
				</h2>
				<button
					onclick={() => (isOpen = false)}
					class="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
					aria-label="Close modal"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Modal Body -->
			<div class="px-6 py-4">
				<slot />
			</div>
		</div>
	</div>
{/if} 
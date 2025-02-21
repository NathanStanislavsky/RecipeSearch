<script>
	import SearchButton from '$lib/SearchButton/SearchButton.svelte';
	import SearchBar from '$lib/SearchBar/SearchBar.svelte';
</script>

<div class="flex min-h-screen items-start justify-center bg-green-100 pt-20 font-serif text-4xl">
	<div class="flex-col">
		<h1>What is in your fridge?</h1>
		<SearchBar />
		<SearchButton />
	</div>
</div>

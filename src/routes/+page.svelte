<script>
	import SearchButton from '$lib/SearchButton/SearchButton.svelte';
	import SearchBar from '$lib/SearchBar/SearchBar.svelte';

	let ingredients = '';

	async function searchRecipes() {
		try {
			const response = await fetch(`/searchRecipes?ingredients=${ingredients}`);
			const data = await response.json();
			console.log(data);
		} catch (error) {
			console.error('Error fetching recipes:', error);
		}
	}
</script>

<div class="flex min-h-screen items-start justify-center bg-green-100 pt-20 font-serif text-4xl">
	<div class="flex-col">
		<h1>What is in your fridge?</h1>
		<SearchBar bind:ingredients />
		<SearchButton onClick={searchRecipes} />
	</div>
</div>

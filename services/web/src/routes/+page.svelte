<script>
	import Navbar from '$lib/Navbar/Navbar.svelte';
</script>

<Navbar user={false} currentPath={'/'} />

<main
	class="flex min-h-screen flex-col items-start justify-center bg-cover bg-center p-8"
	style="background-image: url('https://m.media-amazon.com/images/I/71VgmMSxYWL.jpg')"
>
	<div class="max-w-3xl font-serif">
		<h1 class="mb-4 text-8xl font-bold text-white">Welcome to PantryChef</h1>
		<p class="mb-8 text-2xl text-white">
			To search for recipes, please register and log in. Once you're logged in, you'll be able to
			find and save your favorite recipes.
		</p>
	</div>
</main>

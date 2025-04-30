<script lang="ts">
	import Navbar from '$lib/Navbar/Navbar.svelte';
</script>

<Navbar user={true} currentPath={'/search'} />

<div class="pt-16">
	<slot />
</div>

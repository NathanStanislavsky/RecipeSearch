<script lang="ts">
	import Navbar from '$lib/Navbar/Navbar.svelte';
</script>

<Navbar user={false} currentPath={'/register'} />

<div class="pt-16">
	<slot />
</div>

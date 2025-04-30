<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/Navbar/Navbar.svelte';
</script>

<Navbar user={false} currentPath={'/'} />

<slot />

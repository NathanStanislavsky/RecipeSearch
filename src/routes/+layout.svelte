<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/Navbar/Navbar.svelte';
</script>

<Navbar />
<div class="pt-16">
	<slot />
</div>

<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/Navbar/Navbar.svelte';

	export let data;
</script>

<Navbar />
<div class="pt-16">
	<slot {data} />
</div>

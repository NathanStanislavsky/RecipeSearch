<script lang="ts">
	export let onClick: (() => void) | undefined = undefined;
</script>

<button
	type={onClick ? "button" : "submit"}
	class="mt-4 rounded-xl bg-blue-500 p-4 text-xl text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
	on:click={onClick}
>
	Search
</button>

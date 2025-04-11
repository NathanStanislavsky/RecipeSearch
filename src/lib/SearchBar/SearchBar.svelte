<script lang="ts">
	export let ingredients: string = '';
	export let placeholder: string =
		'Enter ingredients separated by commas (e.g., tomato, basil, garlic)';
</script>

<input
	class="mt-4 w-2xl rounded-2xl bg-slate-50 p-4 text-xl outline-2 outline-sky-700 outline-solid"
	type="text"
	bind:value={ingredients}
	{placeholder}
/>

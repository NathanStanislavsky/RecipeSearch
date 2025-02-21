<script>
	export let value = '';
	export let placeholder = 'Potatoes, carrots, beef...';
	export let onInput = () => {};
</script>

<input
	class="mt-4 w-2xl rounded-2xl bg-green-50 p-4 text-xl outline-2 outline-sky-700 outline-solid"
	type="text"
	bind:value
	{placeholder}
	on:input={onInput}
/>

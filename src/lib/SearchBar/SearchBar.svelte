<script>
	export let value = '';
	export let placeholder = 'Potatoes, carrots, beef...';
	export let onInput = () => {};
</script>

<input type="text" bind:value {placeholder} on:input={onInput} />

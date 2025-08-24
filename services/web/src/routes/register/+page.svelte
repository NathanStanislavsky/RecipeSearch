<script>
	import RegisterForm from '$lib/RegisterForm/RegisterForm.svelte';
	import Navbar from '$lib/Navbar/Navbar.svelte';
</script>

<Navbar user={false} currentPath={'/register'} />

<div class="flex min-h-screen items-center justify-center bg-blue-50">
	<div class="w-full max-w-lg">
		<RegisterForm />
	</div>
</div>

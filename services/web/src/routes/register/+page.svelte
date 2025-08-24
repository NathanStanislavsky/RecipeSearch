<script>
	import RegisterForm from '$lib/RegisterForm/RegisterForm.svelte';
	import Navbar from '$lib/Navbar/Navbar.svelte';
</script>

<Navbar user={false} currentPath={'/register'} />

<div class="flex min-h-screen items-center bg-blue-50 justify-center">
	<div class="w-full max-w-lg">
		<RegisterForm />
	</div>
</div>

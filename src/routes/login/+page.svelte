<script>
	import LoginForm from '$lib/LoginForm/LoginForm.svelte';
	import Navbar from '$lib/Navbar/Navbar.svelte';
</script>

<Navbar user={false} currentPath={'/login'} />

<div class="flex min-h-screen items-center justify-center bg-slate-100">
	<div class="w-full max-w-lg">
		<LoginForm />
	</div>
</div>

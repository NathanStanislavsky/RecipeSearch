<div class="flex items-center justify-center">
	<div class="w-full max-w-md rounded-md bg-white p-6 shadow-md">
		<h1 class="mb-6 text-center text-2xl font-bold">Login</h1>
		<form class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
				<input
					type="email"
					id="email"
					name="email"
					required
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					placeholder="Enter an email"
				/>
			</div>
			<div>
				<label for="password" class="block text-sm font-medium text-gray-700">Password</label>
				<input
					type="password"
					id="password"
					name="password"
					required
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					placeholder="Enter a password"
				/>
			</div>
			<div>
				<button
					type="submit"
					class="w-full rounded-md bg-sky-300 px-4 py-2 font-semibold text-white hover:bg-sky-400 focus:ring-2 focus:ring-sky-600 focus:outline-none"
				>
					Login
				</button>
			</div>
		</form>
	</div>
</div>

<script lang="ts">
	export let recipe: {
		image: string;
		title: string;
		readyInMinutes: number;
		servings: number;
		sourceUrl: string;
	};
</script>

<div class="recipe-card">
	<img src={recipe.image} alt={recipe.title} />
	<h2>{recipe.title}</h2>
	<p>Ready in {recipe.readyInMinutes} minutes</p>
	<p>{recipe.servings} servings</p>
	<a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">View Recipe</a>
</div>

/**
 * Interface for recipe data
 */
export interface Recipe {
    /** URL to the recipe image */
    image: string;
    /** Recipe title */
    title: string;
    /** Time in minutes to prepare the recipe */
    readyInMinutes: number;
    /** Number of servings the recipe makes */
    servings: number;
    /** URL to the original recipe source */
    sourceUrl: string;
}

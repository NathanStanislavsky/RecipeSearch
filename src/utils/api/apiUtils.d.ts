export declare const SPOONACULAR_BASE_URL = "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com";
export declare const getSpoonacularHeaders: () => {
    'x-rapidapi-key': any;
    'x-rapidapi-host': string;
    'Content-Type': string;
};
export declare const createApiUrl: (endpoint: string) => URL;
export declare const handleApiResponse: (response: Response) => Promise<Response>;
export declare const createJsonResponse: (data: unknown, status?: number, headers?: HeadersInit) => Response;

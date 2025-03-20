import { readable } from 'svelte/store';

// Mock for $app/stores
export const mockPage = readable({
  url: { pathname: '/' },
  data: { user: null }
});
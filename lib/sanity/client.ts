import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

// Initialize Sanity Client
export const sanityClient = createClient({
  projectId: process.env.EXPO_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.EXPO_PUBLIC_SANITY_DATASET,
  useCdn: false,
  apiVersion: "2024-01-01",
  token: process.env.EXPO_PIBLIC_SANITY_TOKEN,
});

// Create image URL builder using the official Sanity package
const builder = imageUrlBuilder(sanityClient);

// Export the official urlFor function
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

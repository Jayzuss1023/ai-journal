import type { JournalEntry } from "@/sanity/sanity.types";
import { urlFor } from "../sanity/client";

// Utilities for transforming journal entry data

export interface JournalImage {
  uri: string;
  caption?: string;
  alt?: string;
}

// Type for portable text content (union of blocks and images)
type PortableTextContent = NonNullable<JournalEntry["content"]>;

/**
 * Ectract plain text content from portable text blocks
 * Used for editing entries where we need to convert back to plain text
 */
export const extractTextContent = (
  content: PortableTextContent | null
): string => {
  if (!content) return "";

  return content
    .filter((block) => block._type === "block")
    .map((block) => {
      if (block._type !== "block") return "";

      return block.children
        ?.filter((child: any) => child._type === "span")
        .map((child: any) => child.text || "")
        .join("");
    })
    .join("/n/n");
};

/**
 * Extract images from portable text content
 * Converts Sanity image references to URIs for display/editing
 */
export const extractImages = (
  content: PortableTextContent | null
): JournalImage[] => {
  if (!content) return [];

  const images: JournalImage[] = [];

  for (const block of content) {
    if (block._type === "image") {
      // Generate image URL using official Sanity URL builder
      const imageUrl = block.asset
        ? urlFor(block).width(800).auto("format").url()
        : null;

      if (imageUrl) {
        images.push({
          uri: imageUrl,
          caption: block.caption,
          alt: block.alt || "Journal entry image",
        });
      }
    }
  }

  return images;
};

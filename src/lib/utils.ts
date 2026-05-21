import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // YouTube links
  if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) {
    let videoId = "";
    if (trimmed.includes("youtu.be/")) {
      videoId = trimmed.split("youtu.be/")[1]?.split(/[?#]/)[0];
    } else if (trimmed.includes("/embed/")) {
      return trimmed;
    } else if (trimmed.includes("/live/")) {
      videoId = trimmed.split("/live/")[1]?.split(/[?#]/)[0];
    } else if (trimmed.includes("/shorts/")) {
      videoId = trimmed.split("/shorts/")[1]?.split(/[?#]/)[0];
    } else if (trimmed.includes("v=")) {
      videoId = trimmed.split("v=")[1]?.split("&")[0]?.split(/[?#]/)[0];
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }

  // Vimeo links
  if (trimmed.includes("vimeo.com")) {
    if (trimmed.includes("player.vimeo.com")) {
      return trimmed;
    }
    const match = trimmed.match(/vimeo\.com\/(\d+)/);
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
  }

  return trimmed;
}


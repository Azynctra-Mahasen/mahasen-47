
export type Platform = "whatsapp" | "facebook" | "instagram";

export const validPlatforms: Platform[] = ["whatsapp", "facebook", "instagram"];

export const isValidPlatform = (p: string | undefined): p is Platform => {
  return !!p && validPlatforms.includes(p as Platform);
};

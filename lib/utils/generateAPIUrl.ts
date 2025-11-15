import Constants from "expo-constants";

export const generateAPIUrl = (relativePath: string) => {
  const origin = Constants.experienceUrl.replace("exp://", "https://");
  return `${origin}${relativePath}`;
};

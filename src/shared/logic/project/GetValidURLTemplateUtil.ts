export const GetValidURLTemplateUtil = (url: string) => {
  if (!url) {
    return "";
  }

  // Ensure the URL starts with https:// and ends with a slash
  let cleansedURL = url.startsWith("https://") ? url : `https://${url}`;
  cleansedURL = cleansedURL.endsWith("/") ? cleansedURL : `${cleansedURL}/`;

  return cleansedURL;
};

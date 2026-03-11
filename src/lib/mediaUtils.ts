
export const openMediaInNewTab = (url: string) => {
  if (url.startsWith("data:")) {
    try {
      const parts = url.split(",");
      const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
      const b64Data = parts[1];
      const byteCharacters = atob(b64Data);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      const blob = new Blob(byteArrays, { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (err) {
      console.error("Error opening data URL:", err);
      window.open(url, "_blank");
    }
  } else {
    window.open(url, "_blank");
  }
};

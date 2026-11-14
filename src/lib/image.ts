/** Browser-side: decode any image the browser can read (incl. SVG), crop to a centred square, re-encode as WebP. */
export async function toSquareWebp(file: File, size = 256): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => fail(new Error("Couldn't read that image.")); i.src = url; });
    const s = Math.min(img.naturalWidth || size, img.naturalHeight || size);
    const c = document.createElement("canvas");
    c.width = c.height = size;
    c.getContext("2d")!.drawImage(img, ((img.naturalWidth || s) - s) / 2, ((img.naturalHeight || s) - s) / 2, s, s, 0, 0, size, size);
    return c.toDataURL("image/webp", 0.85);
  } finally { URL.revokeObjectURL(url); }
}

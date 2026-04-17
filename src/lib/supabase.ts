export async function uploadImage(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", bucket);
  formData.append("path", path);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error ?? "Upload failed");
  }

  return json.url as string;
}

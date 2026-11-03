const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function resizeImage(file: File, maxSize = 800, quality = 0.85): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('Escolha uma imagem JPG, PNG ou WebP.');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Não foi possível processar a imagem.');
  }

  // Fundo branco para imagens PNG com transparência, já que o JPEG não tem transparência
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return canvas.toDataURL('image/jpeg', quality);
}

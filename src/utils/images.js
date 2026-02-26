/**
 * Resizes an image file to the specified dimensions and quality.
 * @param {File} file - The image file to resize.
 * @param {Object} options - Resizing options.
 * @param {number} [options.maxWidth=800] - Maximum width of the resized image.
 * @param {number} [options.maxHeight=800] - Maximum height of the resized image.
 * @param {number} [options.quality=0.8] - Quality of the resized image (0 to 1).
 * @param {string} [options.type='image/jpeg'] - Target MIME type (e.g., 'image/jpeg', 'image/webp').
 * @returns {Promise<Blob>} - A promise that resolves to the resized image as a Blob.
 */
export async function resizeImage(file, { maxWidth = 800, maxHeight = 800, quality = 0.8, type = 'image/jpeg' } = {}) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            return reject(new Error('El archivo no es una imagen válida'));
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Maintain aspect ratio
                const ratio = Math.min(maxWidth / width, maxHeight / height);

                // Only resize if the image is larger than the target or we want to force compression
                if (ratio < 1) {
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            console.log(`Image resized: ${img.width}x${img.height} -> ${width}x${height} (${Math.round(blob.size / 1024)}KB)`);
                            resolve(blob);
                        } else {
                            reject(new Error('Error al comprimir la imagen'));
                        }
                    },
                    type,
                    quality
                );
            };
            img.onerror = () => reject(new Error('No se pudo cargar la imagen para procesar'));
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
    });
}

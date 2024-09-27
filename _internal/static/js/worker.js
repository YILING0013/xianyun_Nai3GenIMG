self.onmessage = async function(event) {
    let { base64Images, imageUrls } = event.data;
    let blobs = [];

    // 处理 base64 图像
    base64Images.forEach(image => {
        let base64Data = image.src.split(',')[1];
        let binaryString = atob(base64Data);
        let len = binaryString.length;
        let bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        let blob = new Blob([bytes], { type: 'image/png' });
        blobs.push({ fileName: image.fileName, blob: blob });
    });

    // 处理 URL 图像
    let fetchImage = async (image) => {
        try {
            let response = await fetch(image.src);
            let blob = await response.blob();
            blobs.push({ fileName: image.fileName, blob: blob });
        } catch (error) {
            console.error('Error fetching image:', image.src, error);
        }
    };

    let promises = imageUrls.map(fetchImage);
    await Promise.all(promises);

    self.postMessage({ blobs: blobs });
};

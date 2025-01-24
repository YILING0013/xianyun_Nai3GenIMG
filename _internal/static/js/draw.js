let cropper;
//定义两个全局变量dx和dy
let dx = 0;
let dy = 0;
// 定义全局变量来记录上传来源
var uploadSource = "";
var imageSize = [0, 0];
let isEraserMode = false; // 初始状态为画笔模式
let colorPickerInstance; // 保存颜色选择器实例
var drawColor = null;
// 按钮点击事件监听器
document.getElementById('eraserBtn').addEventListener('click', function() {
    isEraserMode = !isEraserMode; // 切换模式

    // 根据当前模式更新按钮文本
    if (isEraserMode) {
        this.textContent = '切换到画笔';
    } else {
        this.textContent = '切换到橡皮擦';
    }
});

layui.use(['upload', 'jquery'], function() {
	var upload = layui.upload;
	var colorpicker = layui.colorpicker;
	var $ = layui.jquery;

	// 隐藏元素
	$('.slider-container').hide();

	// 历史记录和重做栈
	let historyStack = [];
	let redoStack = [];
	let isDrawing = false;

	// 保存当前状态到历史栈
	function saveState() {
		redoStack = [];
		// 保存当前状态，包括maskCanvas和colorCanvas
		historyStack.push({
			mask: maskCanvas.toDataURL(),
			color: colorCanvas.toDataURL()
		});
	}
	

	// 撤销操作
	function undo() {
		if (historyStack.length > 1) { // 确保保留初始状态
			redoStack.push(historyStack.pop());
			let currentState = historyStack[historyStack.length - 1];
			
			let maskImg = new Image();
			maskImg.onload = function() {
				maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
				maskCtx.drawImage(maskImg, 0, 0);
			}
			maskImg.src = currentState.mask;
	
			let colorImg = new Image();
			colorImg.onload = function() {
				colorCtx.clearRect(0, 0, colorCanvas.width, colorCanvas.height);
				colorCtx.drawImage(colorImg, 0, 0);
			}
			colorImg.src = currentState.color;
		}
	}
	

	// 重做操作
	function redo() {
		if (redoStack.length > 0) {
			let currentState = redoStack.pop();
			historyStack.push(currentState);
			
			let maskImg = new Image();
			maskImg.onload = function() {
				maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
				maskCtx.drawImage(maskImg, 0, 0);
			}
			maskImg.src = currentState.mask;
	
			let colorImg = new Image();
			colorImg.onload = function() {
				colorCtx.clearRect(0, 0, colorCanvas.width, colorCanvas.height);
				colorCtx.drawImage(colorImg, 0, 0);
			}
			colorImg.src = currentState.color;
		}
	}
	// 清空画布
	function clearCanvas() {
		maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
		colorCtx.clearRect(0, 0, colorCanvas.width, colorCanvas.height);
		historyStack = [{
			mask: maskCanvas.toDataURL(),
			color: colorCanvas.toDataURL()
		}]; // 保留初始状态
		redoStack = [];
		let maskPreview = document.getElementById('mask-preview');
    	maskPreview.innerHTML = ''; // 清空现有内容
	}

	// 新增 - 初始化maskCanvas及其事件处理
	let imageCanvas = document.getElementById('imageCanvas');
	let maskCanvas = document.getElementById('maskCanvas');
	let maskCtx = maskCanvas.getContext('2d');
	let colorCanvas = document.getElementById('colorCanvas');
	let colorCtx = colorCanvas.getContext('2d');
	let brushSize = document.getElementById('brushSize');
	let exportBtn = document.getElementById('exportMask');
	let exportColorBtn = document.getElementById('exportColorBtn');
	let lastX = 0;
	let lastY = 0;

	maskCanvas.addEventListener('mousedown', (e) => {
		isDrawing = true;
		[lastX, lastY] = [e.offsetX, e.offsetY];
	});

	maskCanvas.addEventListener('mousemove', draw);

	maskCanvas.addEventListener('mouseup', () => {
		if(isDrawing) {
			saveState();
			isDrawing = false;
		}
	});

	maskCanvas.addEventListener('mouseout', () => {
		if(isDrawing) {
			saveState();
			isDrawing = false;
		}
	});

	// 同样的事件监听器也要添加到 colorCanvas 上
	colorCanvas.addEventListener('mousedown', (e) => {
		isDrawing = true;
		[lastX, lastY] = [e.offsetX, e.offsetY];
	});

	colorCanvas.addEventListener('mousemove', draw);

	colorCanvas.addEventListener('mouseup', () => {
		if (isDrawing) {
			saveState();
			isDrawing = false;
		}
	});

	colorCanvas.addEventListener('mouseout', () => {
		if (isDrawing) {
			saveState();
			isDrawing = false;
		}
	});

	function adjustMaskCanvasSize() {
		// 获取imageCanvas的实际显示尺寸
		var rect = imageCanvas.getBoundingClientRect();

		// 设置maskCanvas的尺寸和位置以匹配imageCanvas
		maskCanvas.style.width = rect.width + 'px';
		maskCanvas.style.height = rect.height + 'px';
		maskCanvas.width = rect.width;
		maskCanvas.height = rect.height;
		// 确保maskCanvas与imageCanvas重叠
		maskCanvas.style.position = 'absolute';
		maskCanvas.style.left = imageCanvas.offsetLeft + 'px';
		maskCanvas.style.top = imageCanvas.offsetTop + 'px';

		colorCanvas.style.width = rect.width + 'px';
		colorCanvas.style.height = rect.height + 'px';
		colorCanvas.width = rect.width;
		colorCanvas.height = rect.height;
		colorCanvas.style.position = 'absolute';
		colorCanvas.style.left = imageCanvas.offsetLeft + 'px';
		colorCanvas.style.top = imageCanvas.offsetTop + 'px';
		// 动态调整.canvas-container的高度
		$('.canvas-container').css('height', rect.height + 'px');
	}

	function onImageLoaded() {
		adjustMaskCanvasSize();
		window.addEventListener('resize', adjustMaskCanvasSize);
		clearCanvas(); // 加载图像时清除并保存初始状态
	}

	// 修改draw函数以支持触摸坐标
	function draw(e) {
		if (!isDrawing) return;
	
		let x, y;
		if (e.touches) {
			x = e.touches[0].clientX - (draw_color_image ? colorCanvas : maskCanvas).getBoundingClientRect().left;
			y = e.touches[0].clientY - (draw_color_image ? colorCanvas : maskCanvas).getBoundingClientRect().top;
			e.preventDefault();
		} else {
			x = e.offsetX;
			y = e.offsetY;
		}
	
		let ctx = draw_color_image ? colorCtx : maskCtx;
	
		// 如果处于橡皮擦模式，则将画笔颜色设置为透明（擦除）
		if (isEraserMode) {
			ctx.globalCompositeOperation = 'destination-out';
			ctx.strokeStyle = 'rgba(0,0,0,1)';
		} else {
			ctx.globalCompositeOperation = 'source-over';
			if (draw_color_image) {
				ctx.strokeStyle = drawColor;
			}
			else ctx.strokeStyle = 'rgba(17,153,238,1)';
		}
	
		ctx.lineWidth = brushSize.value;
		ctx.lineJoin = 'round';
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(lastX, lastY);
		ctx.lineTo(x, y);
		ctx.stroke();
		[lastX, lastY] = [x, y];
	}	

	// 添加触摸事件监听器
	maskCanvas.addEventListener('touchstart', (e) => {
		isDrawing = true;
		let touch = e.touches[0];
		[lastX, lastY] = [touch.clientX - maskCanvas.getBoundingClientRect().left, touch.clientY - maskCanvas.getBoundingClientRect().top];
	});

	maskCanvas.addEventListener('touchmove', draw);

	maskCanvas.addEventListener('touchend', () => {
		if(isDrawing) {
			saveState();
			isDrawing = false;
		}
	});

	maskCanvas.addEventListener('touchcancel', () => {
		if(isDrawing) {
			saveState();
			isDrawing = false;
		}
	});

	// 在页面加载时保存初始状态
	window.onload = () => {
		saveState();
		adjustMaskCanvasSize();
		window.addEventListener('resize', adjustMaskCanvasSize);
	};

	exportBtn.addEventListener('click', exportMask);
	exportColorBtn.addEventListener('click', exportColorImage);

	function exportMask() {
		// 创建一个临时canvas用于导出处理，设置为原始图像的尺寸
		let tempCanvas = document.createElement('canvas');
		tempCanvas.width = imageCanvas.width; // 使用原始图像的宽度
		tempCanvas.height = imageCanvas.height; // 使用原始图像的高度
		let tempCtx = tempCanvas.getContext('2d');
	
		// 将maskCanvas内容按比例缩放绘制到临时canvas上
		tempCtx.drawImage(maskCanvas, 0, 0, maskCanvas.width, maskCanvas.height, 0, 0, tempCanvas.width, tempCanvas.height);
	
		// 获取绘制后的图像数据
		let imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
		let data = imageData.data;

		// 定义绘制颜色的RGB值
		const targetColor = {r: 17, g: 153, b: 238};
		const threshold = 50; // 阈值，用于颜色距离判断

		// 将目标颜色转换为白色，并保留透明区域为黑色
		for (let i = 0; i < data.length; i += 4) {
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			const a = data[i + 3];

			// 计算当前像素颜色与目标颜色的距离，考虑透明度影响
			const distance = Math.sqrt(
				Math.pow(r - targetColor.r, 2) +
				Math.pow(g - targetColor.g, 2) +
				Math.pow(b - targetColor.b, 2)
			);

			// 如果颜色距离在阈值范围内，将其转换为纯白色
			if (distance < threshold) {
				// 处理非透明像素和半透明像素
				data[i] = 255; // red
				data[i + 1] = 255; // green
				data[i + 2] = 255; // blue
				if (a < 255) {
					data[i + 3] = 255; // 如果像素是半透明的，调整为完全不透明
				}
			} else if (a === 0) {
				data[i] = 0; // 保持未绘制区域为黑色
				data[i + 1] = 0;
				data[i + 2] = 0;
				data[i + 3] = 255; // 确保透明区域完全不透明
			}
		}

		// 将修改后的图像数据重新放回画布
		tempCtx.putImageData(imageData, 0, 0);

	
		// 导出处理后的图像为Base64编码的PNG格式
		let imageURL = tempCanvas.toDataURL('image/png');
		let maskBase64Data = imageURL.split(',')[1];
		uploadedMaskBase64 = maskBase64Data;
	
		// 获取mask-preview元素，并清空其内容
		let maskPreview = document.getElementById('mask-preview');
		maskPreview.innerHTML = '';
	
		// 创建一个新的img元素并设置其src属性为导出的图像
		let imageElement = new Image();
		imageElement.src = imageURL;
		imageElement.style.width = '50px'; // 设置图像宽度，根据需要调整
		imageElement.style.height = '50px'; // 设置图像高度，根据需要调整
	
		// 将新的img元素添加到mask-preview中
		maskPreview.appendChild(imageElement);
	}
	
	function exportColorImage() {
		// 创建一个临时 canvas，设置为原始图像的尺寸
		let tempCanvas = document.createElement('canvas');
		tempCanvas.width = imageCanvas.width;
		tempCanvas.height = imageCanvas.height;
		let tempCtx = tempCanvas.getContext('2d');
	
		// 绘制原始图像到临时 canvas
		tempCtx.drawImage(imageCanvas, 0, 0, imageCanvas.width, imageCanvas.height);
	
		// 创建一个临时的彩色 canvas，用于缩放彩色绘图到原始图像的尺寸
		let tempColorCanvas = document.createElement('canvas');
		tempColorCanvas.width = imageCanvas.width;
		tempColorCanvas.height = imageCanvas.height;
		let tempColorCtx = tempColorCanvas.getContext('2d');
	
		// 缩放并绘制彩色 canvas 到临时的彩色 canvas
		tempColorCtx.drawImage(colorCanvas, 0, 0, colorCanvas.width, colorCanvas.height, 0, 0, tempColorCanvas.width, tempColorCanvas.height);
	
		// 将缩放后的彩色 canvas 绘制到临时 canvas
		tempCtx.drawImage(tempColorCanvas, 0, 0);
	
		// 导出最终图像为 Base64 编码的 PNG 格式
		let imageURL = tempCanvas.toDataURL('image/png');
		let imageBase64Data = imageURL.split(',')[1];
		uploadedImageBase64 = imageBase64Data;
	}
	
	let isPickingColor = false; // 取色模式开关
	let colorPreview;

	colorPickerInstance = colorpicker.render({
		elem: '#ID-colorpicker-demo-size-sm',
		color: 'rgba(0,0,0,1)',
    	alpha: true, // 开启透明度
    	format: 'rgb',
		size: 'sm',
		done: function(color){
			// 获取颜色值
			drawColor = color;
		}
	});
	
// 取色工具按钮点击事件监听器
document.getElementById('colorPickerBtn').addEventListener('click', function(e) {
    isPickingColor = !isPickingColor; // 切换取色模式

    if (isPickingColor) {
        this.textContent = '退出取色工具';

        // 创建颜色预览组件
        colorPreview = document.createElement('div');
        colorPreview.style.width = '50px';
        colorPreview.style.height = '50px';
        colorPreview.style.border = '1px solid #000';
        colorPreview.style.position = 'absolute';
        colorPreview.style.pointerEvents = 'none';
        colorPreview.style.zIndex = '1000'; // 确保在顶层
        document.body.appendChild(colorPreview);

        // 设置颜色预览的位置为当前鼠标位置
        colorPreview.style.left = `${e.pageX + 10}px`; // 鼠标右侧10px
        colorPreview.style.top = `${e.pageY + 10}px`;  // 鼠标下方10px
    } else {
        this.textContent = '取色工具';
        if (colorPreview) {
            document.body.removeChild(colorPreview); // 移除颜色预览组件
            colorPreview = null;
        }
    }
});

// 在最上层的 Canvas 上添加鼠标移动事件监听器来更新颜色预览
maskCanvas.addEventListener('mousemove', function(e) {
    if (!isPickingColor || !colorPreview) return; // 只在取色模式下更新颜色预览

    // 获取 imageCanvas 的显示尺寸
    let displayRect = imageCanvas.getBoundingClientRect();

    // 计算实际的像素坐标
    let x = (e.offsetX * imageCanvas.width) / displayRect.width;
    let y = (e.offsetY * imageCanvas.height) / displayRect.height;

    let ctx = imageCanvas.getContext('2d'); // 使用 imageCanvas 的上下文来获取图像数据
    let imageData = ctx.getImageData(x, y, 1, 1); // 获取1x1像素的数据
    let pixel = imageData.data; // 获取像素数据 [r, g, b, a]

    // 将颜色转换为RGB格式
    let color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;

    // 更新颜色预览
    colorPreview.style.backgroundColor = color;

    // 更新颜色预览框的位置，跟随鼠标
    colorPreview.style.left = `${e.pageX + 10}px`; // 鼠标右侧10px
    colorPreview.style.top = `${e.pageY + 10}px`;  // 鼠标下方10px
});

// 在最上层的 Canvas 上添加点击事件监听器来选择颜色
maskCanvas.addEventListener('click', function(e) {
    if (!isPickingColor || !colorPreview) return; // 如果未激活取色工具，则不执行任何操作

    // 获取 imageCanvas 的显示尺寸
    let displayRect = imageCanvas.getBoundingClientRect();

    // 计算实际的像素坐标
    let x = (e.offsetX * imageCanvas.width) / displayRect.width;
    let y = (e.offsetY * imageCanvas.height) / displayRect.height;

    let ctx = imageCanvas.getContext('2d'); // 使用 imageCanvas 的上下文来获取图像数据
    let imageData = ctx.getImageData(x, y, 1, 1); // 获取1x1像素的数据
    let pixel = imageData.data; // 获取像素数据 [r, g, b, a]

    // 将颜色转换为RGB格式
    let color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
    
    // 设置为当前绘制的颜色
    drawColor = color;

    // 更新颜色选择器的颜色
    colorpicker.render({
        elem: '#ID-colorpicker-demo-size-sm',
        color: color, // 设置为选取的颜色
        alpha: true, // 开启透明度
        format: 'rgb',
        size: 'sm',
        done: function(newColor){
            drawColor = newColor;
        }
    });

    // 阻止事件冒泡，以免触发绘画功能
    e.stopPropagation();

    // 退出取色模式
    isPickingColor = false;
    document.getElementById('colorPickerBtn').textContent = '取色工具';
    if (colorPreview) {
        document.body.removeChild(colorPreview); // 移除颜色预览组件
        colorPreview = null;
    }
});
	// 实例1
	var uploadInst1 = upload.render({
		elem: '#ID-upload-demo-drag',
		auto: false, // 不自动上传
		choose: function(obj) {
			uploadSource = "Instance1"; // 记录来源为实例1
			$('#mask-draw-container').removeClass('layui-col-md6').addClass('layui-col-md12');
			obj.preview(function(index, file, result) {
				// 弹出询问框，是否读取元数据
				layer.confirm('是否读取图像元数据到参数？(含seed)', {
					btn: ['是', '否'] // 按钮
				}, function(index) {
					// 用户选择"是"后的操作
					extractAndLogMetadata(file);
					layer.close(index);
					continueProcessingImage(result); // 继续后续处理
				}, function(index) {
					// 用户选择"否"后的操作
					layer.close(index);
					continueProcessingImage(result); // 继续后续处理
				});
			});
		},
		done: function(res, index, upload) {
			this.item.val('');
		}
	});
	
	function extractAndLogMetadata(file) {
		const reader = new FileReader();
		reader.onload = function(e) {
			const data = new Uint8Array(e.target.result);
			const textChunks = extractPngTextChunks(data);
			const parsedComment = extractParsedComment(textChunks);
			if(parsedComment.prompt){
				$('#tagarea').val(parsedComment.prompt);
			}
			if(parsedComment.uc){
				$('#tagarea2').val(parsedComment.uc);
			}
			if(parsedComment.seed){
				$('#seed').val(parsedComment.seed);
			}
			if(parsedComment.scale){
				window.Scale_input.setValue((parsedComment.scale)* 50);
				document.getElementById('Scale-value').innerText = parsedComment.scale.toFixed(2);
			}
			if(parsedComment.steps<=28){
				window.Steps_input.setValue(parsedComment.steps);
			}
			if(parsedComment.cfg_rescale){
				window.Rescale_input.setValue((parsedComment.cfg_rescale)* 50);
				document.getElementById('Rescale-value').innerText = parsedComment.cfg_rescale.toFixed(2);
			}
			if(parsedComment.uncond_scale){
				window.Content_Strength_input.setValue((parsedComment.uncond_scale)* 50);
				document.getElementById('Content-Strength-value').innerText = parsedComment.uncond_scale.toFixed(2);
			}
			if (parsedComment.strength){
				window.Strength_input.setValue((parsedComment.strength)* 50);
				document.getElementById('Strength-value').innerText = parsedComment.strength.toFixed(2);
			}
			if(parsedComment.noise){
				window.Noise_input.setValue((parsedComment.noise)* 50);
				document.getElementById('Noise-value').innerText = parsedComment.noise.toFixed(2);
			}else window.Noise_input.setValue(0);
		};
		reader.readAsArrayBuffer(file);
	}
	
	function extractPngTextChunks(data) {
		function readChunk(offset) {
			if (offset >= data.length) {
				return null;
			}
			const length = new DataView(data.buffer, offset, 4).getUint32(0);
			const chunkType = new TextDecoder('ascii').decode(data.slice(offset + 4, offset + 8));
			const chunkData = data.slice(offset + 8, offset + 8 + length);
			const crc = data.slice(offset + 8 + length, offset + 12 + length);
			return {
				length,
				chunkType,
				chunkData,
				crc,
				nextOffset: offset + 12 + length
			};
		}
	
		const chunks = [];
		let offset = 8;  // PNG header is 8 bytes
		while (offset < data.length) {
			const chunk = readChunk(offset);
			if (!chunk || !chunk.chunkType) {
				break;
			}
			if (chunk.chunkType === 'tEXt' || chunk.chunkType === 'iTXt') {
				const text = new TextDecoder('utf-8').decode(chunk.chunkData);
				chunks.push({ type: chunk.chunkType, text });
			}
			offset = chunk.nextOffset;
		}
		return chunks;
	}
	
	function extractParsedComment(chunks) {
		for (const chunk of chunks) {
			if (chunk.type === 'tEXt' && chunk.text.startsWith('Comment')) {
				try {
					const commentData = chunk.text.split('\u0000')[1];
					const commentJson = JSON.parse(commentData);
					return commentJson;
				} catch (e) {
					console.error('Failed to parse Comment chunk', e);
				}
			}
		}
		return null;  // Return null if no valid Comment chunk is found
	}
	
	function continueProcessingImage(result) {
		// 创建一个Image对象
		var img = new Image();
		img.onload = function() {
			// 获取图像的原始尺寸
			var width = img.width;
			var height = img.height;

			// 计算缩放比例，使宽度和高度等比缩放为64的倍数
			var scale = Math.min(1048576 / (width * height), 1);

			// 按比例缩放宽度和高度
			width = Math.round(width * scale);
			height = Math.round(height * scale);

			// 修正width和height，确保它们都是64的倍数
			width = width + (64 - (width % 64)) % 64;
			height = height + (64 - (height % 64)) % 64;

			// 确保缩放后的宽度和高度乘积不超过1048576
			while (width * height > 1048576) {
				scale = Math.min(1048576 / (width * height), 1);
				width = Math.round(img.width * scale);
				height = Math.round(img.height * scale);
				width = width + (64 - (width % 64)) % 64;
				height = height + (64 - (height % 64)) % 64;
			}
			// 尝试增大宽度和高度，使其尽可能接近1048576
			while ((width + 64) * (height + 64) <= 1048576) {
				width += 64;
				height += 64;
			}
			imageSize = [width, height];
			updateSlidersWithImageSize();
			// 获取canvas元素和上下文
			var canvas = document.getElementById('imageCanvas');
			var ctx = canvas.getContext('2d');
	
			// 设置canvas尺寸
			canvas.width = width;
			canvas.height = height;
	
			// 在canvas上绘制图像
			ctx.drawImage(img, 0, 0, width, height);
	
			// 获取完整的 Base64 字符串
			var base64 = canvas.toDataURL('image/png');
	
			// 移除前缀 "data:image/png;base64,"
			var base64Data = base64.split(',')[1];
	
			// 将处理过的 Base64 数据赋值给 uploadedImageBase64
			uploadedImageBase64 = base64Data;
	
			// 更新前端显示
			$('#ID-upload-demo-preview').removeClass('layui-hide');
			$('#ID-upload-demo-drag').addClass('layui-hide');
			$('#Pro-upload-picture-drag').addClass('layui-hide');
			$('#expand-picture-drag').addClass('layui-hide');
			// 显示滑条元素
			$('.slider-container').show();
			$('#delete-image-btn').show();
			onImageLoaded();
			$('#mask-draw').show();
			// 更新图像尺寸显示
			var imageSizeDisplay = document.getElementById('imageSize');
			if (imageSizeDisplay) {
				imageSizeDisplay.textContent = width + ' x ' + height;
			}
	
			// 初始化maskCanvas为透明
			maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
			maskCanvas.style.opacity = '0.5';
		};
		img.src = result; // 设置图片源为上传的图片
	}	

    document.getElementById('exportBtn').addEventListener('click', function() {
        if (cropper) {
            cropper.getCroppedCanvas({
                fillColor: '#FFFFFF'
            }).toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                //获取图片的base64编码
                var reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onload = function(e) {
                    uploadedImageBase64 = e.target.result.split(',')[1];
                }
                loadImageToCanvas(url);
                // 将撤销URL的操作移动到这里
            });
        }
    });
    
    function loadImageToCanvas(imageUrl) {
        var img = new Image();
        img.onload = function() {
            $('#ID-upload-demo-preview').removeClass('layui-hide');
            // 显示滑条元素
			$('.slider-container').show();
            $('#delete-image-btn').show();
			$('#mask-draw').show();
            var canvas = document.getElementById('imageCanvas');
            var ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, img.width, img.height);
            // 图像加载完成后，撤销Blob URL
            URL.revokeObjectURL(imageUrl);
            // 调用onImageLoaded或其他相关的逻辑
            onImageLoaded();
        };
        img.src = imageUrl;
    }    
	// 实例2
	var uploadInst2 = upload.render({
		elem: '#Pro-upload-picture-drag', // 绑定元素
		auto: false, // 不自动上传
		accept: 'images', // 只允许上传图片
		choose: function(obj) {
            uploadSource = "Instance2"; // 记录来源为实例2
			// 选择文件后的回调
			obj.preview(function(index, file, result) {
                $('#Pro-upload-picture-drag').addClass('layui-hide');
                $('#ID-upload-demo-drag').addClass('layui-hide');
				$('#expand-picture-drag').addClass('layui-hide');
				window.isProcessing = true;
				const img = document.getElementById('Pro-draw-image');
				img.src = result; // 使用选择的图像文件创建一个URL
				img.style.display = 'block';
                $('#Pro-draw').show();
				if(cropper) {
					cropper.destroy(); // 如果之前已经初始化了cropper，则先销毁
				}

				cropper = new Cropper(img, {
					aspectRatio: 1, // 限制比例为1:1
					background: true, // 显示网格背景
					center: true, // 显示中心指示器
					viewMode: 1, // 限制图像不超出画布
					zoomable: true, // 允许缩放
					scalable: true, // 允许缩放
					wheelZoomRatio: 0.1, // 滚轮缩放的灵敏度
					movable: true, // 明确允许移动图像
					dragMode: 'move', // 设置拖动模式为移动图像
					crop(event) {
						dx = Math.floor(event.detail.x);
						dy = Math.floor(event.detail.y);
					},
				});
			});
		},
		error: function() {
			// 请求异常回调
		}
	});

	$('#clear-all-Btn').click(function(event) {
		event.stopPropagation();
		// 清除canvas内容
		var canvas = document.getElementById('imageCanvas');
		var ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (cropper) {
            cropper.destroy();
            cropper = null; // 重置cropper变量
        }
    
        // 重置上传来源标志
        uploadSource = "";
        // 清空可能包含的图像src
        const img = document.getElementById('Pro-draw-image');
        if(img) {
            img.src = '';
            img.style.display = 'none'; // 或根据需要调整
        }

		// 隐藏滑条和删除按钮
		$('.slider-container').hide();

		// 隐藏图像预览区域
		$('#ID-upload-demo-preview').addClass('layui-hide');
        $('#ID-upload-demo-drag').removeClass('layui-hide');
        $('#Pro-upload-picture-drag').removeClass('layui-hide');
		$('#expand-picture-drag').removeClass('layui-hide');
		// 获取mask-preview元素，并清空其内容
		let maskPreview = document.getElementById('mask-preview');
		maskPreview.innerHTML = '';
		// 隐藏蒙版绘制区域
		$('#mask-draw').hide();
		$('#Pro-draw').hide();

		// 重置上传组件的状态
		$('#ID-upload-demo-drag').next('input[type="file"]').val('');
        $('#Pro-upload-picture-drag').next('input[type="file"]').val('');
		uploadedImageBase64 = null;
		uploadedMaskBase64 = null;
		window.isProcessing = false;
	});

	// 撤销、重做和清空按钮的事件绑定
	document.getElementById('undoBtn').addEventListener('click', undo);
	document.getElementById('redoBtn').addEventListener('click', redo);
	document.getElementById('clearBtn').addEventListener('click', clearCanvas);

	// 删除按钮点击事件
	$('#delete-image-btn').click(function(event) {
		event.stopPropagation();

		// 清除canvas内容
		var canvas = document.getElementById('imageCanvas');
		var ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// 隐藏滑条和删除按钮
		$('.slider-container').hide();
		$(this).hide();

		// 隐藏图像预览区域
		$('#ID-upload-demo-preview').addClass('layui-hide');
        //如果上传为实例1，则显示实例1的上传区域
        if(uploadSource == "Instance1"){
            $('#ID-upload-demo-drag').removeClass('layui-hide');
            $('#Pro-upload-picture-drag').removeClass('layui-hide');
			$('#expand-picture-drag').removeClass('layui-hide');
        };
		// 获取mask-preview元素，并清空其内容
		let maskPreview = document.getElementById('mask-preview');
		maskPreview.innerHTML = '';
		// 隐藏蒙版绘制区域
		$('#mask-draw').hide();

		// 重置上传组件的状态
		$('#ID-upload-demo-drag').next('input[type="file"]').val('');
        $('#mask-draw-container').removeClass('layui-col-md12').addClass('layui-col-md6');
		uploadedImageBase64 = null;
		uploadedMaskBase64 = null;
		augmentImageValue = null;
		document.querySelectorAll('input[name="augment-image"]').forEach(radio => {
			radio.checked = false;
		});
		previousValue = '';
		// 重新渲染单选框
		var form = layui.form;
		form.render('radio');
		imageSize = [0, 0];
	});
});

layui.use(['upload', 'jquery'], function() {
    var $ = layui.jquery;
    var upload = layui.upload;
    var layer = layui.layer;

    $('.Vibe-Transfer-container').hide();

    var uploadInst = upload.render({
        elem: '#upload-vibe',
        url: '', // 不需要上传接口，留空
        auto: false, // 关闭自动上传
        choose: function(obj) {
            obj.preview(function(index, file, result) {
                // 创建一个Image对象
                var image = new Image();
                image.src = result;
                image.onload = function() {
                    // 创建canvas
                    var canvas = document.createElement('canvas');
                    var ctx = canvas.getContext('2d');
                    
                    // 设置目标尺寸
                    var targetWidth = 448;
                    var targetHeight = 448;
                    
                    // 确保画布大小符合目标尺寸
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    
                    // 计算最佳绘制比例和位置，以保持图像比例
                    var imgWidth = image.width;
                    var imgHeight = image.height;
                    var scale = Math.min(targetWidth / imgWidth, targetHeight / imgHeight);
                    var x = (targetWidth - imgWidth * scale) / 2;
                    var y = (targetHeight - imgHeight * scale) / 2;
                    
                    // 用黑色填充背景
                    ctx.fillStyle = "#000";
                    ctx.fillRect(0, 0, targetWidth, targetHeight);
                    
                    // 绘制调整后的图像
                    ctx.drawImage(image, x, y, imgWidth * scale, imgHeight * scale);
                    
					var adjustedImageURL = canvas.toDataURL();
                    var base64Data = adjustedImageURL.split(',')[1];
                    var uniqueId = 'img-' + Date.now(); // 生成唯一ID

                    imagesBase64[uniqueId] = base64Data; // 存储图像的Base64编码
					// 为滑条设置初始值
                    informationExtracted[uniqueId] = 1.0; // 初始化滑条值
                    Reference_strength[uniqueId] = 0.6; // 初始化滑条值
                    
                    // 接下来，使用调整后的图像URL替换原始result
                    // 显示Vibe-Transfer容器
                    $('.Vibe-Transfer-container').show();
					var newElement = `
						<div id="${uniqueId}" style="display: flex;align-items: center;gap: 15px;">
							<div style="width: 100px;">
								<img class="layui-upload-img" src="${adjustedImageURL}" style="width: 100%; height: 80px;">
								<div><a class="layui-btn layui-btn-xs layui-btn-fluid demo-delete" data-id="${uniqueId}">删除</a></div>
							</div>
							<div style="width: 95%;">
								<div class="control-container">
									<label for="slider-${uniqueId}" class="control-label">Information Extracted:</label>
									<input type="range" id="slider-${uniqueId}" name="slider-${uniqueId}" min="0" max="50" value="50" style="flex-grow: 1;">
									<span id="slider-value-${uniqueId}">1.00</span>
								</div>
								<hr class="ws-space-16">
								<div class="control-container">
									<label for="Reference-Strength-${uniqueId}" class="control-label">Reference Strength:</label>
									<input type="range" id="Reference-Strength-${uniqueId}" name="Reference-Strength-${uniqueId}" min="0" max="50" value="30" style="flex-grow: 1;">
									<span id="Reference-Strength-value-${uniqueId}">0.60</span>
								</div>
							</div>
						</div>`;

               	 	$('.Vibe-img-container').append(newElement);

					// 绑定滑条事件，使用闭包确保uniqueId被正确引用
                    $(document).on('input', `#slider-${uniqueId}`, function() {
                        var value = $(this).val();
						$(`#slider-value-${uniqueId}`).text((value / 50).toFixed(2));
                        informationExtracted[uniqueId] = value / 50; // 更新对应的值
                    });
					$(document).on('input', `#Reference-Strength-${uniqueId}`, function() {
                        var value = $(this).val();
						// 更新滑条值显示
						$(`#Reference-Strength-value-${uniqueId}`).text((value / 50).toFixed(2));
                        Reference_strength[uniqueId] = value / 50; // 更新对应的值
                    });

					// 绑定删除按钮事件
					$(`#${uniqueId} .demo-delete`).on('click', function() {
						// 从对象中移除对应项
                        delete imagesBase64[uniqueId];
                        delete informationExtracted[uniqueId];
                        delete Reference_strength[uniqueId];
						var idToDelete = $(this).data('id');
						$(`#${idToDelete}`).remove();
					});
				};
            });
        }
    });
});

function processImage() {
    // 从展示区获取图像的base64字符串
    const displayContainer = document.getElementById('img-display');
    const existingImg = displayContainer.querySelector('img');
    if (!existingImg) {
        alert('请先在指定区域加载一个图像！');
        return;
    }
    const base64Src = existingImg.src;

    if (base64Src && cropper) {
        const img = new Image();
        img.onload = function() {
            // 获取裁剪区域数据和图像数据
            const cropBoxData = cropper.getCropBoxData();
            const imageData = cropper.getImageData();

            // 创建一个新的Canvas来合成图像
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = imageData.naturalWidth;
            canvas.height = imageData.naturalHeight;

            // 获取被Cropper处理的图像元素
            const cropperImage = document.getElementById('Pro-draw-image');

            // 首先绘制原图像
            ctx.drawImage(cropperImage, 0, 0, canvas.width, canvas.height);

            // 计算新图像在原图上的正确位置和尺寸
            const dWidth = Math.floor(cropBoxData.naturalWidth);
            const dHeight = Math.floor(cropBoxData.naturalHeight);

            // 在裁剪区域绘制从div获取的新图像
            ctx.drawImage(img, dx, dy, dWidth, dHeight);

            // 导出或显示最终的合成图像
            const finalImage = canvas.toDataURL('image/png');

            // 清空展示区并更新合成后的图像
            displayContainer.innerHTML = '';
            var newImg = document.createElement('img');
            newImg.src = finalImage;
            newImg.style.maxWidth = '100%';
            newImg.style.height = 'auto';
            displayContainer.appendChild(newImg); // 添加新图像到展示区

			// 更新预览区图像
            updatePreviewArea(base64Src, finalImage);
        };
        img.src = base64Src;
    } else {
        alert('请先上传一个图像文件，并确保cropper已初始化！');
    }
}

// 更新预览区的图像
function updatePreviewArea(originalSrc, finalSrc) {
    var previewArea = document.getElementById('img-preview');
    if (!previewArea) {
        console.error('预览区域未找到，请确保预览区域存在。');
        return;
    }

    // 获取所有预览图的容器
    var previewContainers = previewArea.querySelectorAll('div');
    previewContainers.forEach(function(container) {
        var previewImg = container.querySelector('img');
        if (previewImg && previewImg.src === originalSrc) {
            previewImg.src = finalSrc;
        }
    });
}

document.getElementById('fillBtn').addEventListener('click', processImage);
  
  document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('remove_background').addEventListener('click', function() {
        let data = {
            image_base64: uploadedImageBase64
        };
		 // 显示加载动画
		var index = layer.load(2, { // 1表示风格，可选0-2
		shade: [0.1,'#fff'] // 0.1透明度的白色背景
		});
        fetch('/api/remove_background', { // 确保URL与你的Flask应用中定义的一致
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(data => {
            if (data.mask_base64) {
                displayMask(data.mask_base64);
				// 隐藏加载动画
				layer.close(index);
            } else {
                console.error('No mask received');
				// 隐藏加载动画
				layer.close(index);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
			// 隐藏加载动画
			layer.close(index);
        });
    });
});

function displayMask(maskBase64) {
    let maskPreview = document.getElementById('mask-preview');
    maskPreview.innerHTML = ''; // 清空现有内容

    // 反转mask中的黑白颜色
    let imageElement = new Image();
    imageElement.onload = function() {
        let canvas = document.createElement('canvas');
        canvas.width = imageElement.width;
        canvas.height = imageElement.height;

        let ctx = canvas.getContext('2d');
        ctx.drawImage(imageElement, 0, 0);

        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let data = imageData.data;

        // 反转颜色
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];        // red
            data[i + 1] = 255 - data[i + 1];  // green
            data[i + 2] = 255 - data[i + 2];  // blue
            // Alpha通道不变
        }

        ctx.putImageData(imageData, 0, 0);
        
        let invertedImage = new Image();
        invertedImage.src = canvas.toDataURL();
		//将图像的base64编码赋值给uploadedMaskBase64
		uploadedMaskBase64 = invertedImage.src.split(',')[1];
		invertedImage.style.width = '50px'; // 设置图像宽度，根据需要调整
		invertedImage.style.height = '50px'; // 设置图像高度，根据需要调整
        maskPreview.appendChild(invertedImage); // 将处理后的图像添加到页面中
    };
    imageElement.src = maskBase64;
}


layui.use(['upload'], function() {
    var upload = layui.upload;
    var $ = layui.jquery;
    var canvas = document.getElementById('expand-imageCanvas');
    var ctx = canvas.getContext('2d');
    var image = new Image();
    var originalData = null;
    var lastExpandDirection = null;
    var expandSizeTotal = 0;
    var canExpand = { left: true, right: true, up: true, down: true };

    function initCanvasBackground() {
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function resizeImageIfNeeded(img) {
		let width = img.width;
		let height = img.height;
	
		// 计算宽度和高度以确保它们是64的倍数
		width = Math.floor(width / 64) * 64;
		height = Math.floor(height / 64) * 64;
	
		// 确保最大边小于4096
		const maxDimension = 4096;
		const widthRatio = width > maxDimension ? maxDimension / width : 1;
		const heightRatio = height > maxDimension ? maxDimension / height : 1;
		const ratio = Math.min(widthRatio, heightRatio);
	
		width = Math.floor(width * ratio);
		height = Math.floor(height * ratio);
	
		// 设置 canvas 尺寸并绘制图像
		canvas.width = width;
		canvas.height = height;
		ctx.drawImage(img, 0, 0, width, height);
	
		// 更新 originalData 为当前canvas的状态
		originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	}
	

    var uploadInst = upload.render({
		elem: '#expand-picture-drag', // 绑定元素
		auto: false, // 关闭自动上传
		accept: 'images', // 仅接受图片类型的文件
		choose: function(obj) {
			obj.preview(function(index, file, result) {
				image.onload = function() {
					resizeImageIfNeeded(image);
					$('#expand-picture').show();
					$('#ID-upload-demo-drag').addClass('layui-hide');
                    $('#Pro-upload-picture-drag').addClass('layui-hide');
                    $('#expand-picture-drag').addClass('layui-hide');
                    $('#expand-picture-container').removeClass('layui-hide');
					initCanvasBackground();
					ctx.drawImage(image, 0, 0);
	
					// 使用视觉大小调整容器的高度
					var rect = canvas.getBoundingClientRect();
					$('.img-canvas-container').css('height', (rect.height) + 'px');
				};
				image.src = result;
			});
		}
	});
	

    document.getElementById('reset-button').addEventListener('click', function() {
		
        canExpand.left = canExpand.right = canExpand.up = canExpand.down = true;
        if (originalData) {
            canvas.width = originalData.width;
            canvas.height = originalData.height;
            ctx.putImageData(originalData, 0, 0);
            initCanvasBackground();
            ctx.drawImage(image, 0, 0);
            lastExpandDirection = null;
            expandSizeTotal = 0;
			// 使用视觉大小调整容器的高度
			var rect = canvas.getBoundingClientRect();
			$('.img-canvas-container').css('height', (rect.height) + 'px');
        }
    });

	document.getElementById('upload-button').addEventListener('click', function() {
		// 更新 originalData 为当前canvas的状态
		originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		image.src = canvas.toDataURL();
		canExpand.left = canExpand.right = canExpand.up = canExpand.down = true;
		expandSizeTotal = 0;
		lastExpandDirection = null;
	});
	

	document.getElementById('download-button').addEventListener('click',function(){
		//获取canvas图像并下载
		var a = document.createElement('a');
		a.href = canvas.toDataURL();
		//采用生成12位随机字符串作为文件名
		a.download = Math.random().toString(36).substr(2, 12) + '.png';
		a.click();
	});

	document.getElementById('delete-expand-picture-btn').addEventListener('click', function() {
		canExpand.left = canExpand.right = canExpand.up = canExpand.down = true;
		// 清除canvas内容
		var canvas = document.getElementById('expand-imageCanvas');
		var ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		// 隐藏图像预览区域
		$('#expand-picture').hide();
		// 获取mask-preview元素，并清空其内容
		let maskPreview = document.getElementById('mask-preview');
		maskPreview.innerHTML = '';
		// 重置上传组件的状态
		$('#expand-picture-drag').next('input[type="file"]').val('');
		$('#ID-upload-demo-drag').removeClass('layui-hide');
        $('#Pro-upload-picture-drag').removeClass('layui-hide');
        $('#expand-picture-drag').removeClass('layui-hide');
        $('#expand-picture-container').addClass('layui-hide');
		expandImageBase64 = null;
		expandMaskBase64 = null;
		expand_width = 0;
		expand_height = 0;
	});

	document.getElementById('remove-button').addEventListener('click', function() {
		// 获取mask-preview元素，并清空其内容
		let maskPreview = document.getElementById('mask-preview');
		maskPreview.innerHTML = '';
		expandImageBase64 = null;
		expandMaskBase64 = null;
		expand_width = 0;
		expand_height = 0;
	});
	

    document.getElementById('export-button').addEventListener('click', function() {
        if (!lastExpandDirection || expandSizeTotal === 0) return;
        const exportCanvas = document.createElement('canvas');
        const exportCtx = exportCanvas.getContext('2d');
        const maskCanvas = document.createElement('canvas');
        const maskCtx = maskCanvas.getContext('2d');
        const totalSize = 512;  // 总的导出画布尺寸
        let remainingSize = totalSize - expandSizeTotal; // 计算剩余尺寸
		let mask_diffusion = Number(document.getElementById('mask_diffusion').value);

        // 设置导出画布和蒙版画布的尺寸
        if (lastExpandDirection === 'left' || lastExpandDirection === 'right') {
            exportCanvas.width = maskCanvas.width = totalSize;
            exportCanvas.height = maskCanvas.height = canvas.height;
        } else { // 'up' or 'down'
            exportCanvas.width = maskCanvas.width = canvas.width;
            exportCanvas.height = maskCanvas.height = totalSize;
        }

        exportCtx.fillStyle = maskCtx.fillStyle = '#FFFFFF';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height); // 先将蒙版全部填充为白色
        maskCtx.fillStyle = '#000000'; // 黑色填充用于非扩展区域

        // 确定白色填充部分和图像绘制部分，同时设置蒙版
        if (lastExpandDirection === 'left') {
        exportCtx.fillRect(0, 0, expandSizeTotal, exportCanvas.height);
        // 确保从canvas的左侧开始绘制剩余部分
        exportCtx.drawImage(canvas, expandSizeTotal, 0, canvas.width - expandSizeTotal, canvas.height, expandSizeTotal, 0, canvas.width - expandSizeTotal, exportCanvas.height);
        maskCtx.fillRect(expandSizeTotal + mask_diffusion, 0, canvas.width - expandSizeTotal, exportCanvas.height);
        }
        else if (lastExpandDirection === 'right') {
        // 白色填充在新画布的最右侧
        exportCtx.fillRect(remainingSize, 0, expandSizeTotal, exportCanvas.height);
        exportCtx.drawImage(canvas, canvas.width - remainingSize - expandSizeTotal, 0, remainingSize, canvas.height, 0, 0, remainingSize, exportCanvas.height);
        maskCtx.fillRect(0, 0, remainingSize - mask_diffusion, exportCanvas.height);
        }
        else if (lastExpandDirection === 'up') {
        exportCtx.fillRect(0, 0, exportCanvas.width, expandSizeTotal);
        exportCtx.drawImage(canvas, 0, expandSizeTotal, canvas.width, remainingSize, 0, expandSizeTotal, canvas.width, remainingSize);
        maskCtx.fillRect(0, expandSizeTotal + mask_diffusion, exportCanvas.width, remainingSize);
        }
        else if (lastExpandDirection === 'down') {
        exportCtx.fillRect(0, remainingSize, exportCanvas.width, expandSizeTotal);
        // 从源图像底端开始截取剩余高度的图像，绘制到新画布的顶端开始位置
        exportCtx.drawImage(canvas, 0, canvas.height - remainingSize - expandSizeTotal, canvas.width, remainingSize, 0, 0, canvas.width, remainingSize);
        maskCtx.fillRect(0, 0, exportCanvas.width, remainingSize - mask_diffusion);
        }
		//清空旧的预览图
		document.getElementById('mask-preview').innerHTML = '';

        // 将结果转换为Base64并显示
        const imageDataUrl = exportCanvas.toDataURL("image/png");
		//将图像的base64编码赋值给expandImageBase64
		expandImageBase64 = imageDataUrl.split(',')[1];
		//返回图像的长宽
		expand_width = exportCanvas.width;
		expand_height = exportCanvas.height;
        const imgPreview = document.createElement('img');
        imgPreview.src = imageDataUrl;
        imgPreview.style.width='50px';
        imgPreview.style.height='50px';
        document.getElementById('mask-preview').appendChild(imgPreview);

        // 导出蒙版图像
        const maskDataUrl = maskCanvas.toDataURL("image/png");
		//将蒙版的base64编码赋值给expandMaskBase64
		expandMaskBase64 = maskDataUrl.split(',')[1];
        const maskImgPreview = document.createElement('img');
        maskImgPreview.src = maskDataUrl;
        maskImgPreview.style.width='50px';
        maskImgPreview.style.height='50px';
        document.getElementById('mask-preview').appendChild(maskImgPreview);
    });

	document.getElementById('fill-expand-Btn').addEventListener('click', function() {
		var imgElement = document.querySelector('#img-display img');
		const totalSize = 512;  // 总的导出画布尺寸
        let remainingSize = totalSize - expandSizeTotal; // 计算剩余尺寸
		if (imgElement) {
			var imageC = new Image();
			imageC.onload = function() {
				// 获取Canvas的上下文
				var canvas = document.getElementById('expand-imageCanvas');
				var ctx = canvas.getContext('2d');
	
				// 定义替换的起始坐标
				let startX = 0;
				let startY = 0;
	
				// 根据扩展方向设置起始坐标
				switch (lastExpandDirection) {
					case 'right':
						startX = canvas.width - remainingSize - expandSizeTotal;
						startY = 0;
						break;
					case 'left':
						startX = 0;
						startY = 0;
						break;
					case 'up':
						startX = 0;
						startY = 0;
						break;
					case 'down':
						startX = 0;
						startY = canvas.height - remainingSize - expandSizeTotal;
						break;
				}
	
				// 在Canvas上绘制图像C，覆盖图像B的部分
				ctx.drawImage(imageC, startX, startY);
				canExpand.left = canExpand.right = canExpand.up = canExpand.down = true;
				image.src = canvas.toDataURL();
				// 更新 originalData 为当前canvas的状态
				originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				
				expandSizeTotal = 0;
			};
			imageC.src = imgElement.src;  // 设置图像源为img标签的src属性，即图像C的base64
		} else {
			alert('缺失填补图像');
		}
	});	

	function getMousePos(canvas, evt) {
		var rect = canvas.getBoundingClientRect();
		return {
			x: (evt.clientX - rect.left) * (canvas.width / rect.width),
			y: (evt.clientY - rect.top) * (canvas.height / rect.height)
		};
	}
	

    canvas.addEventListener('mousedown', function(e) {
		var pos = getMousePos(canvas, e);
		const margin = 100; // 考虑到边界的范围
		const x = pos.x;
		const y = pos.y;
		let direction;
	
		if (x > canvas.width - margin && canExpand.right) direction = 'right';
		else if (x < margin && canExpand.left) direction = 'left';
		else if (y > canvas.height - margin && canExpand.down) direction = 'down';
		else if (y < margin && canExpand.up) direction = 'up';
	
		if (direction) {
			expandCanvas(direction);
			canExpand.left = canExpand.right = canExpand.up = canExpand.down = false;
			canExpand[direction] = true;
			lastExpandDirection = direction;
			expandSizeTotal += 64; // 增加扩展尺寸的总和
		}
		// 使用视觉大小调整容器的高度
		var rect = canvas.getBoundingClientRect();
		$('.img-canvas-container').css('height', (rect.height) + 'px');
	});
	

    function expandCanvas(direction) {
        const expandSize = 64;
        let newWidth = canvas.width;
        let newHeight = canvas.height;
        let xOffset = 0;
        let yOffset = 0;

        switch (direction) {
            case 'right':
                newWidth += expandSize;
                break;
            case 'left':
                newWidth += expandSize;
                xOffset = expandSize;
                break;
            case 'down':
                newHeight += expandSize;
                break;
            case 'up':
                newHeight += expandSize;
                yOffset = expandSize;
                break;
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = newWidth;
        canvas.height = newHeight;
        initCanvasBackground();
        ctx.putImageData(imageData, xOffset, yOffset);
        ctx.fillStyle = '#FFFFFF';
        if (direction === 'right' || direction === 'left') {
            ctx.fillRect(direction === 'right' ? (canvas.width - expandSize) : 0, 0, expandSize, canvas.height);
        } else {
            ctx.fillRect(0, direction === 'down' ? (canvas.height - expandSize) : 0, canvas.width, expandSize);
        }
    }
});
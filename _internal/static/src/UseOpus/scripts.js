var uploadedImageBase64 = null;
var uploadedMaskBase64 = null;
var expandImageBase64 = null;
var expandMaskBase64 = null;
var initialPosition = null;
var characterPrompts = [];
var v4_prompt_char_captions = [];
var v4_negative_prompt_char_captions = [];
var seedText = null;
var expand_width = 0;
var expand_height = 0;
let imageIndex = 0; // 用于跟踪图像的索引
var progress = 0;
var attempt = 0;
var defry = 0;
var imagesBase64 = {};
var informationExtracted = {};
var Reference_strength = {};
var isProcessing = false;
var augmentImageValue = '';
let previousValue = '';
var processedJobs = new Set();
var autoDownload = false;
var autoVoice = false;
var disabled_original_image=false;
let isKeydownListenerBound = false;
var draw_color_image = false;
var sliderValues = {
    'Scale-input': 5.0,
    'Steps-input': 28,
    'image-input': 1,
    'Width-input': 832,
    'Height-input': 1216,
    'Content-Strength-input': 1.0,
    'Rescale-input': 0.0,
    'Strength-input': 0.7,
    'Noise-input': 0
};

// 转换为数组的函数
function convertObjectsToArrays(imagesBase64, informationExtracted, Reference_strength) {
    var imagesArray = [];
    var informationExtractedArray = [];
    var strengthArray = [];

    // 遍历其中一个对象的所有键（假设所有对象都有相同的键集）
    for (var key in imagesBase64) {
        console.log(key);
        if (imagesBase64.hasOwnProperty(key)) {
            // 将每个对象对应键的值添加到相应的数组中
            imagesArray.push(imagesBase64[key]);
            informationExtractedArray.push(informationExtracted[key]);
            strengthArray.push(Reference_strength[key]);
        }
    }
    console.log(strengthArray);

    return {
        images: imagesArray,
        informationExtracted: informationExtractedArray,
        Reference_strength: strengthArray
    };
}

layui.use('slider', function() {
    var slider = layui.slider;

    function updateSliderValue(elem, value) {
        var sliderId = elem.replace('#', '');
        var convertedValue;
        if (sliderId === 'Scale-input' || sliderId === 'Rescale-input' ||
            sliderId === 'Strength-input' || sliderId === 'Noise-input') {
            convertedValue = value / 50; // 转换为小数
        } else {
            convertedValue = value;
        }

        // 保存转换后的值到 localStorage
        localStorage.setItem(sliderId, convertedValue);
    }

    // 渲染 Scale-input 滑条
    window.Scale_input = slider.render({
        elem: '#Scale-input',
        tips: false,
        min: 0,
        max: 500,
        step: 1,
        value: localStorage.getItem('Scale-input') * 50 || 250,
        change: function(value) {
            updateSliderValue('#Scale-input', value);
            // 仅对 Scale-input 显示一位小数
            document.getElementById('Scale-value').innerText = (value / 50).toFixed(1);
        }
    });

    // 在渲染滑动条后立即更新 <span> 元素的显示值
    if (localStorage.getItem('Scale-input') !== null) {
        document.getElementById('Scale-value').innerText = parseFloat(localStorage.getItem('Scale-input')).toFixed(1);
    } else {
        document.getElementById('Scale-value').innerText = '5.0'; // 默认值
    }

    // 渲染 Steps-input 滑条
    window.Steps_input = slider.render({
        elem: '#Steps-input',
        input: true,
        min: 1,
        max: 50,
        value: localStorage.getItem('Steps-input') || 28,
        change: function(value) {
            updateSliderValue('#Steps-input', value);
        }
    });

    // 渲染 image-input 滑条
    window.image_input = slider.render({
        elem: '#image-input',
        input: true,
        min: 1,
        max: 500,
        value: localStorage.getItem('image-input') || 1,
        change: function(value) {
            updateSliderValue('#image-input', value);
        }
    });

    var heightValue = localStorage.getItem('Height-input') || 512;

    function calculateMaxHeight(widthValue) {
        var minBound = 3063808;
        var maxBound = 3145728;
        var maxHeight = 512;
        var closestBelow = 512;
        var closestBelowDiff = Number.MAX_SAFE_INTEGER;

        for (var x = 512; x <= 4096; x += 64) {
            var product = x * widthValue;
            if (product >= minBound && product <= maxBound) {
                maxHeight = x;
            } else if (product < minBound) {
                var diff = minBound - product;
                if (diff < closestBelowDiff) {
                    closestBelow = x;
                    closestBelowDiff = diff;
                }
            }
        }

        return (maxHeight !== 512) ? maxHeight : closestBelow;
    }

    function updateHeightSlider(widthValue) {
        var newMax = calculateMaxHeight(widthValue);
        var newValue = Math.min(heightValue, newMax);
        updateSliderValue('#Height-input', newValue);

        // 重新渲染 Height-input 滑条
        window.Height_input = slider.render({
            elem: '#Height-input',
            input: true,
            min: 512,
            max: newMax,
            value: newValue,
            step: 64,
            showstep: true,
            change: function(value) {
                localStorage.setItem('Height-input', value);
                heightValue = value; // 更新当前值
            }
        });
    }

    // 渲染 Width-input 滑条
    window.Width_input = slider.render({
        elem: '#Width-input',
        input: true,
        min: 512,
        max: 4096,
        value: localStorage.getItem('Width-input') || 1024,
        step: 64,
        showstep: true,
        change: function(value) {
            updateHeightSlider(value);
            localStorage.setItem('Width-input', value);
        }
    });

    window.updateSlidersWithImageSize = function() {
        if (imageSize[0] >= 512 && imageSize[0] <= 2048 && imageSize[1] >= 512 && imageSize[1] <= 2048) {
            // 更新 Width-input 滑块
            var widthValue = 512 + ((imageSize[0] - 512) / 64);
            window.Width_input.setValue(widthValue);
            localStorage.setItem('Width-input', imageSize[0]);

            // 更新 Height-input 滑块
            var heightValue = 512 + ((imageSize[1] - 512) / 64);
            window.Height_input.setValue(heightValue);
            localStorage.setItem('Height-input', imageSize[1]);
        }
    }

    // 渲染初始的 Height-input 滑条
    updateHeightSlider(localStorage.getItem('Width-input') || 1024);

    // 渲染 Rescale-input 滑条
    window.Rescale_input = slider.render({
        elem: '#Rescale-input',
        tips: false,
        min: 0,
        max: 50,
        step: 1,
        value: localStorage.getItem('Rescale-input') * 50 || 0,
        change: function(value) {
            updateSliderValue('#Rescale-input', value);
            document.getElementById('Rescale-value').innerText = (value / 50).toFixed(2);
        }
    });
    // 在渲染滑动条后立即更新 <span> 元素的显示值
    if (localStorage.getItem('Rescale-input') !== null) {
        document.getElementById('Rescale-value').innerText = parseFloat(localStorage.getItem('Rescale-input')).toFixed(2);
    } else {
        document.getElementById('Rescale-value').innerText = '0.00'; // 默认值
    }
    // 渲染 Strength-input 滑条
    window.Strength_input = slider.render({
        elem: '#Strength-input',
        tips: false,
        min: 0,
        max: 50,
        step: 1,
        value: localStorage.getItem('Strength-input') * 50 || 35,
        change: function(value) {
            updateSliderValue('#Strength-input', value);
            document.getElementById('Strength-value').innerText = (value / 50).toFixed(2);
        }
    });
    if (localStorage.getItem('Strength-input') !== null) {
        document.getElementById('Strength-value').innerText = parseFloat(localStorage.getItem('Strength-input')).toFixed(2);
    } else {
        document.getElementById('Strength-value').innerText = '0.70'; // 默认值
    }
    // 渲染 Noise 滑条
    window.Noise_input = slider.render({
        elem: '#Noise-input',
        tips: false,
        min: 0,
        max: 50,
        step: 1,
        value: localStorage.getItem('Noise-input') * 50 || 0,
        change: function(value) {
            updateSliderValue('#Noise-input', value);
            document.getElementById('Noise-value').innerText = (value / 50).toFixed(2);
        }
    });
    if (localStorage.getItem('Noise-input') !== null) {
        document.getElementById('Noise-value').innerText = parseFloat(localStorage.getItem('Noise-input')).toFixed(2);
    } else {
        document.getElementById('Noise-value').innerText = '0.00'; // 默认值
    }
});

function getSliderValue(sliderId) {
    var value = localStorage.getItem(sliderId);
    // 检查 localStorage 中是否有值，如果没有，则使用 sliderValues 中的默认值
    return value !== null ? parseFloat(value) : sliderValues[sliderId];
}


function generateTOTP(secretKey) {
    const epoch = Math.floor(new Date()
        .getTime() / 1000 / 60); // 获取当前时间的分钟时间戳
    const totp = CryptoJS.SHA256(epoch + secretKey)
        .toString(); // 使用SHA-256进行哈希
    return totp;
}

function updateQueuePosition(position) {
    // 获取ID为'queue'的元素
    var queueElement = document.getElementById('queue');

    // 初始化初始排名
    if (initialPosition === null) {
        initialPosition = position;
        progress = 0; // 初始化进度为0%
    }

    // 计算进度
    if (position > 0) {
        // 计算基于当前位置的进度，最高为90%
        progress = Math.max(0, Math.min(90, ((initialPosition - position) / initialPosition) * 100));
    } else if (position === 0 && progress < 90) {
        // 当排名为0且进度小于90%时，直接跳至90%
        progress = 90;
        // 从90%递增到99%的逻辑
        updateProgressOverTime();
    }

    // 更新页面元素
    if (queueElement) {
        queueElement.innerHTML = '<a href="javascript:;">生成进度：' + progress.toFixed(0) + '%</a>';
    } else {
        console.error('队列位置元素未找到');
    }

    // 当进度为100时的额外处理
    if (progress >= 100) {
        // 可以在这里添加一些进度完成时的逻辑
        console.log('进度完成！');
    }
}

// 从90%到99%的递增逻辑
function updateProgressOverTime() {
    var interval = 1000; // 每秒更新一次
    var step = (99 - 90) / 10; // 计算每次更新的步长
    var handle = setInterval(function() {
        if (progress >= 99) {
            clearInterval(handle);
            progress = 99;
        } else {
            progress += step;
            updateQueuePosition(0); // 更新进度显示
        }
    }, interval);
}

document.addEventListener('DOMContentLoaded', (event) => {
    // Event listener for the Github button
    document.getElementById('github')
        .addEventListener('click', function() {
            window.open('https://github.com/YILING0013', '_blank');
        });

    // Event listener for the BiliBili button
    document.getElementById('bilibili')
        .addEventListener('click', function() {
            window.open('https://space.bilibili.com/487156342', '_blank');
        });

    // Event listener for the afdian button
    document.getElementById('afdian')
        .addEventListener('click', function() {
            window.open('https://afdian.com/a/lingyunfei', '_blank');
        });
});

layui.use(['form', 'jquery'], function() {
    var form = layui.form;
    var $ = layui.jquery;
    // 隐藏滑条元素
    $('.slider-container').hide();
    $('.Vibe-container').hide();
    // 监听SEMA复选框的状态变化
    form.on('checkbox(smea-checkbox)', function(data) {
        var displayStyle = data.elem.checked ? 'inline-block' : 'none';
        $('#dyn-container').css('display', displayStyle);
    });
});

function resetButtonState() {
    var button = document.getElementById("generate-images");
    button.disabled = false;
    button.classList.remove("layui-btn-disabled");
    button.textContent = "Generate Images";
    window.attempt = 0;
    clearQueuePosition();
    if (autoVoice) {
        // 获取MP3文件列表并随机播放一个
        $.getJSON('/get_mp3_files', function(mp3Files) {
            if (mp3Files.length > 0) {
                var randomIndex = Math.floor(Math.random() * mp3Files.length);
                var randomFile = mp3Files[randomIndex];
                var audio = new Audio('/static/voice/' + randomFile);
                audio.play();
            }
        });
    }
}

document.getElementById("generate-images").addEventListener('click', function() {
    var i = getSliderValue('image-input');
    collectParametersAndSendRequest(0, i);
});

layui.use(function(){
    var form = layui.form;
    var layer = layui.layer;
    // checkbox 事件
    form.on('checkbox(autoDownload)', function(data){
        var elem = data.elem; // 获得 checkbox 原始 DOM 对象
        if(elem.checked==true){
        autoDownload = true;
        console.log('自动下载已启用');
        }else{
            autoDownload = false;
            console.log('自动下载已禁用');
        }
    });
    form.on('checkbox(autoVoice)', function(data){
        var elem = data.elem; // 获得 checkbox 原始 DOM 对象
        if(elem.checked==true){
            autoVoice = true;
            console.log('自动语音播放已启用');
        }else{
            autoVoice = false;
            console.log('自动语音播放已禁用');
        }
    });
    form.on('checkbox(disabled_original_image)', function(data){
        var elem = data.elem; // 获得 checkbox 原始 DOM 对象
        if(elem.checked==true){
            disabled_original_image = true;
            console.log('禁用原图已启用');
        }else{
            disabled_original_image = false;
            console.log('禁用原图已禁用');
        }
    });
    form.on('checkbox(draw_color_image)', function(data){
        var elem = data.elem; // 获得 checkbox 原始 DOM 对象
        if(elem.checked==true){
            draw_color_image = true;
            console.log('绘制彩色图像已启用');
        }else{
            draw_color_image = false;
            console.log('绘制彩色图像已禁用');
        }
        
    });
    form.on('radio(augment-image)', function(data){
        const currentValue = data.value;
    
        // 检查是否重复点击
        if (currentValue === previousValue) {
            // 重复点击时，取消选中并清空变量值
            document.querySelectorAll('input[name="augment-image"]').forEach(radio => {
                radio.checked = false;
            });
            layer.msg('取消选中');
            augmentImageValue = '';
            previousValue = '';
            // 重新渲染单选框
            form.render('radio');
        } else {
            // 正常点击逻辑
            augmentImageValue = currentValue;
            layer.msg('value: ' + augmentImageValue + ', checked: ' + data.elem.checked);
            previousValue = currentValue;
        }

        if (augmentImageValue === 'emotion') {
            document.getElementById('emotionContent').style.display = 'block';
        } else {
            document.getElementById('emotionContent').style.display = 'none';
        }
        if (augmentImageValue === 'colorize') {
            document.getElementById('colorizeContent').style.display = 'block';
        } else {
            document.getElementById('colorizeContent').style.display = 'none';
        }
    });
});

function collectParametersAndSendRequest(attempt, maxAttempts) {
    var Auto_random = $("input[name='Auto_random']").is(':checked');
    var Auto_polling = $("input[name='Auto_polling']").is(':checked');
    var i = getSliderValue('image-input');
    maxAttempts = i;
    if (Auto_random) {
        // 触发#randomSelectBtn的点击事件
        document.getElementById('randomSelectBtn').click();
        // 延时10ms
        setTimeout(() => {}, 10);
        
    }
    if (Auto_polling) {
        // 触发#getTerms的点击事件
        document.getElementById('getTerms').click();
        // 延时10ms
        setTimeout(() => {}, 10);
    }
    if (attempt >= maxAttempts) {
        console.log('已达到最大尝试次数');
        resetButtonState();
        return; // 达到最大尝试次数，结束递归
    }

    var button = document.getElementById("generate-images");
    button.disabled = true;
    button.classList.add("layui-btn-disabled");
    button.textContent = "生成中(将连续绘制更改为1取消连续绘制)";

    // 获取SEMA复选框的状态
    var isSemaChecked = document.querySelector("input[name='SMEA']")
        .checked;
    var isDecrispChecked = document.querySelector("input[name='Decrisp']")
        .checked;
    var isVarietyChecked = document.querySelector("input[name='Variety']")
        .checked;

    // 获取DYN复选框的状态
    var dynContainer = document.getElementById('dyn-container');
    var isDynVisible = dynContainer.style.display !== 'none';
    var isDynChecked = isDynVisible && dynContainer.querySelector("input[name='DYN']")
        .checked;
    //获取Vibe_Transfer复选框的状态
    var isVibeChecked = document.querySelector("input[name='Vibe_Transfer']")
        .checked;
    // 获取是否使用位置信息的复选框状态
    var isUsePositionsChecked = document.querySelector("input[name='AI_choice_Positions']")
        .checked;
    // 收集参数
    var textarea = document.getElementById("tagarea");

    function getPositivePrompt() {
        var text = textarea.value;
        // 使用正则表达式移除/* */注释
        var textWithoutComments = text.replace(/\/\*[\s\S]*?\*\//g, '');
        return textWithoutComments;
    }
    var positivePrompt = getPositivePrompt();

    // 获取页面上的 seed 元素
    var seedElement = document.getElementById("seed");
    var seedValue;

    if (!seedElement.value) {
        // 如果seedElement为空，生成一个9位随机数
        seedValue = Math.floor(Math.random() * (1e9 - 1e8)) + 1e8;
    } else {
        // 如果seedElement不为空，使用它的值
        seedValue = seedElement.value;
    }
    // 更新 seedText 全局变量为当前使用的 seed 值
    seedText = seedValue.toString();
    if (Window.isProcessing) {
        height = 1024;
        width = 1024;
    }

    var negativePrompt = document.getElementById("tagarea2").value;
    var scale = getSliderValue('Scale-input');
    var steps = getSliderValue('Steps-input');
    var width = 768;
    var height = 1024;
    width = getSliderValue('Width-input');
    height = getSliderValue('Height-input');
    var promptGuidanceRescale = getSliderValue('Rescale-input');
    var strength = getSliderValue('Strength-input');
    var noise = getSliderValue('Noise-input');
    var sampler = document.getElementById("sampling-algorithm").value;
    var noise_schedule = document.getElementById("noise-schedule").value;
    var model = document.getElementById("model-list").value;
    var resultArrays = convertObjectsToArrays(imagesBase64, informationExtracted, Reference_strength);
    const secretKey = 'xianyun_2776359982_xianyun@idlecloud.cc_THIS_PROJECT_IS_PERSONALLY_CREATED_BY_XIANYUN_(QQ_NUMBER:_2776359982)_AND_IS_AVAILABLE_FOR_FREE_USE._IF_YOU_HAVE_PAID_FOR_THIS_PROJECT,_PLEASE_REQUEST_A_REFUND_AND_REPORT_THE_INCIDENT';
    const totp = generateTOTP(secretKey);
    var sm = isSemaChecked; // 当SEMA选中时sm为true，否则为false
    var decrisp = isDecrispChecked;
    var variety = isVarietyChecked;
    var sm_dyn = isDynChecked; // 当DYN可见且选中时sm_dyn为true，否则为false
    var vibe = isVibeChecked;
    var isUsePositions = !isUsePositionsChecked;
    var base64 = uploadedImageBase64;
    var mask = uploadedMaskBase64;
    var expandImage = expandImageBase64;
    var expandMask = expandMaskBase64;
    var action = true;
    var req_type = augmentImageValue;

    var requestBody = {
        model: model,
        positivePrompt: positivePrompt,
        negativePrompt: negativePrompt,
        scale: scale,
        steps: steps,
        width: width,
        height: height,
        promptGuidanceRescale: promptGuidanceRescale,
        noise_schedule: noise_schedule,
        seed: seedText,
        sampler: sampler,
        sm: sm,
        sm_dyn: sm_dyn,
        decrisp: decrisp,
        variety: variety,
        pictureid: totp,
        characterPrompts: characterPrompts,
        v4_prompt_char_captions: v4_prompt_char_captions,
        v4_negative_prompt_char_captions: v4_negative_prompt_char_captions,
        use_coords: isUsePositions,
        autoDownload: autoDownload
    };

    // 如果上传了图像，则在请求体中添加图像相关的字段

    if (vibe) {
        requestBody.reference_image_multiple = resultArrays.images;
        requestBody.reference_information_extracted_multiple = resultArrays.informationExtracted;
        requestBody.reference_strength_multiple = resultArrays.Reference_strength;
    }
    if (base64) {
        requestBody.image = base64;
        requestBody.noise = noise;
        requestBody.strength = strength;
        requestBody.action = action;
    }
    if (mask) {
        requestBody.mask = mask;
        requestBody.sm = false;
        requestBody.sm_dyn = false;
        if (disabled_original_image) {
            requestBody.disabled_original_image = true;
        }
    }
    if (expandImage && expandMask) {
        requestBody.noise = noise;
        requestBody.strength = strength;
        requestBody.action = action;
        requestBody.image = expandImage;
        requestBody.mask = expandMask;
        requestBody.width = expand_width;
        requestBody.height = expand_height;
    }
    if (req_type) {
        requestBody.req_type = req_type;
        if(req_type === 'colorize'){
            requestBody.defry = Number(document.getElementById("defryInput").value);
            requestBody.prompt = document.getElementById("colorize_Prompt").value;
        }
        if (req_type === 'emotion') {
            var emotionSelect = document.querySelector('select[name="emotion"]');
            var selectedEmotion = emotionSelect.value;
            var emotionPrompt = document.getElementById("emotion_Prompt").value;
            requestBody.prompt = selectedEmotion + ';; ' + emotionPrompt;
            requestBody.defry = window.defry;
        }        
    }

    // 发送POST请求到Flask后端
    fetch('/api/generate_image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => response.json())
        .then(data => {
            if (data.job_id) {
                updateQueuePosition(data.queue_position);
                pollForResult(data.job_id, attempt, maxAttempts); // 轮询结果
            } else {
                throw new Error(data.error || '未知错误');
            }
            if (attempt >= maxAttempts) {
                console.log('标志1');
                resetButtonState();
            }
        })
        .catch(error => {
            // 检查是否达到最大尝试次数
            if (attempt >= maxAttempts) {
                resetButtonState();
                alert(`请求失败: ${error}`);
            } else {
                alert(`请求失败: ${error}`);
                // 如果还没有达到最大尝试次数，则尝试下一次
                collectParametersAndSendRequest(attempt + 1, maxAttempts);
            }
        });
}

function pollForResult(job_id, attempt, maxAttempts) {
    attempt = window.attempt;
	var userOpusElement = document.getElementById("userOpus");
    console.log(attempt);
    // 轮询逻辑
    setTimeout(() => {
        // 假设的轮询API调用
        fetch('/api/get_result/' + job_id)
            .then(response => response.json())
            .then(data => {
                if (processedJobs.has(job_id)) {
                    clearQueuePosition();
                    return;
                }
                if (data.queue_position !== undefined) {
                    updateQueuePosition(data.queue_position);
                }
                if (data.image_base64) {
                    window.attempt += 1;
                    processedJobs.add(job_id);
                    progress = data.progress;
                    var previewContainer = document.getElementById('img-display');
                    var img = document.createElement('img');
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    img.src = 'data:image/png;base64,' + data.image_base64;

                    previewContainer.innerHTML = '';
                    previewContainer.appendChild(img);

                    var previewArea = document.getElementById('img-preview');
                    var verticalContainer = document.createElement('div');
                    verticalContainer.title = '点击预览图像,左右键切换图像';
                    verticalContainer.style.display = 'flex';
                    verticalContainer.style.flexDirection = 'column';
                    verticalContainer.style.alignItems = 'center';
                    verticalContainer.style.border = '2px solid transparent'; // 默认无边框
                    verticalContainer.dataset.index = imageIndex; // 设置数字索引
                    imageIndex++; // 索引递增

                    var previewImg = document.createElement('img');
                    previewImg.style.width = '50px';
                    previewImg.style.height = '50px';
                    previewImg.src = img.src;

                    var seedSpan = document.createElement('span');
                    seedSpan.textContent = 'Seed: ' + seedText;
                    seedSpan.style.display = 'block';
                    seedSpan.style.marginTop = '10px';
                    seedSpan.style.textAlign = 'center';
                    seedSpan.style.cursor = 'pointer';

                    // 创建删除按钮
                    var deleteBtn = document.createElement('button');
                    deleteBtn.textContent = 'Delete';
                    deleteBtn.classList.add('layui-btn', 'layui-btn-fluid', 'layui-btn-danger', 'layui-btn-xs');
                    deleteBtn.style.marginBottom = '10px';
                    deleteBtn.style.cursor = 'pointer';

                    // 为删除按钮添加点击事件监听器
                    deleteBtn.addEventListener('click', function() {
                        // 从previewArea中移除verticalContainer
                        previewArea.removeChild(verticalContainer);

                        // 获取所有预览图的容器
                        var remainingContainers = previewArea.querySelectorAll('div');
                        if (remainingContainers.length > 0) {
                            // 更新展示区为下一个图像
                            var nextImg = remainingContainers[0].querySelector('img').src;
                            updateDisplayArea(nextImg);
                        } else {
                            // 如果没有剩余的图像，清空展示区
                            previewContainer.innerHTML = '';
                        }
                    });

                    // 将预览图、种子信息和删除按钮都添加到容器中
                    verticalContainer.appendChild(previewImg);
                    verticalContainer.appendChild(seedSpan);
                    verticalContainer.appendChild(deleteBtn); // 将删除按钮添加到容器中

                    // 将容器添加到预览区域，确保最新的图像排序在最前
                    if (previewArea.firstChild) {
                        previewArea.insertBefore(verticalContainer, previewArea.firstChild);
                    } else {
                        previewArea.appendChild(verticalContainer);
                    }

                    previewImg.onclick = function() {
                        var clickedImgSrc = this.src; // 获取当前被点击的图像的src
                        updateDisplayArea(clickedImgSrc);
                        
                        // 清除所有容器的边框
                        var allContainers = previewArea.querySelectorAll('div');
                        allContainers.forEach(function(container) {
                            container.style.border = '2px solid transparent';
                        });
                        
                        // 为当前容器添加边框
                        verticalContainer.style.border = '2px solid #16baaa';
                    };
                    if (!isKeydownListenerBound) {
                        document.addEventListener('keydown', keydownHandler);
                        isKeydownListenerBound = true; // 标记已绑定监听器
                    }
                
                    function keydownHandler(event) {
                        var allContainers = document.getElementById('img-preview').querySelectorAll('div');
                    
                        if (allContainers.length === 0) {
                            console.log('没有预览图像');
                            return;
                        }
                    
                        var selectedIndex = -1;
                        for (var i = 0; i < allContainers.length; i++) {
                            if (allContainers[i].style.border === '2px solid rgb(22, 186, 170)') {
                                selectedIndex = i;
                                break;
                            }
                        }
                    
                        if (selectedIndex === -1) {
                            console.log('没有选中的图像容器');
                            return;
                        }
                    
                        document.addEventListener('keydown', function(event) {
                            // 判断当前焦点是否在可输入的元素上
                            var isInputElement = event.target.tagName === 'INPUT' || 
                                                 event.target.tagName === 'TEXTAREA' || 
                                                 event.target.isContentEditable;
                        
                            if (!isInputElement) {
                                if (event.key === 'ArrowRight') {
                                    console.log('向右切换到下一个图像');
                                    // 向右切换到索引较大的图像（靠右）
                                    if (selectedIndex < allContainers.length - 1) {
                                        var nextContainer = allContainers[selectedIndex + 1];
                                        highlightContainer(nextContainer);
                                        updateDisplayArea(nextContainer.querySelector('img').src);
                                    }
                                } else if (event.key === 'ArrowLeft') {
                                    console.log('向左切换到上一个图像');
                                    // 向左切换到索引较小的图像（靠左）
                                    if (selectedIndex > 0) {
                                        var prevContainer = allContainers[selectedIndex - 1];
                                        highlightContainer(prevContainer);
                                        updateDisplayArea(prevContainer.querySelector('img').src);
                                    }
                                }
                            }
                        });                        
                    }                    
                    
                    function highlightContainer(container) {
                        var allContainers = document.getElementById('img-preview').querySelectorAll('div');
                        allContainers.forEach(function(c) {
                            c.style.border = '2px solid transparent';
                        });
                        container.style.border = '2px solid #16baaa';
                    }     
                    (function(currentSeed) {
                        seedSpan.onclick = function() {
                            updateSeedInput(currentSeed);
                        };
                    })(seedText);
					// 更新 Opus 值显示
                    if(data.remaining_opus !== undefined) {
                        userOpusElement.innerHTML = "Opus: " + data.remaining_opus; // 更新 remaining_opus 值
                    }
                    if (window.isProcessing) {
                        if (typeof processImage === 'function') {
                            processImage();
                        } else {
                            console.error('未定义的错误');
                        }
                    }
                    clearQueuePosition();
                    if (window.attempt < maxAttempts) {
                        attempt = window.attempt;
                        collectParametersAndSendRequest(attempt, maxAttempts);
                    }
                    if (window.attempt >= maxAttempts) {
                        console.log('标志2');
                        // 重新启用按钮
                        resetButtonState();
                    }
                } else if (data.status && (data.status === 'processing' || data.status === 'queued')) {
                    // 如果仍在队列中，继续轮询
                    console.log('排队中，等待结果...');
                    attempt = window.attempt;
                    pollForResult(job_id, attempt, maxAttempts);
                } else if (data.error) {
                    window.attempt += 1;
                    throw new Error(data.error);
                }
            })
            .catch(error => {
                console.error('轮询结果出错:', error);
                window.attempt += 1;
                attempt = window.attempt;
                if (attempt >= maxAttempts) {
                    // 重新启用按钮
                    console.log('标志3');
                    resetButtonState();
                    alert(`请求失败: ${error}`);
                }
                // 出错后也进行下一次请求
                if (attempt < maxAttempts) {
                    collectParametersAndSendRequest(attempt, maxAttempts);
                }
            });
    }, 2000); // 延时2000毫秒后执行
}

function clearQueuePosition() {
    var queueElement = document.getElementById('queue');
    if (queueElement) {
        queueElement.innerHTML = '';
    }
}

// 更新展示区的图像
function updateDisplayArea(base64Src) {
    var displayContainer = document.getElementById('img-display');
    displayContainer.innerHTML = ''; // 清空展示区

    var newImg = document.createElement('img');
    newImg.src = base64Src;
    newImg.style.maxWidth = '100%';
    newImg.style.height = 'auto';

    displayContainer.appendChild(newImg); // 添加新图像到展示区
}

function updateSeedInput(seed) {
    if (window.confirm('你确定要更新种子值吗？')) {
        var seedInputElement = document.getElementById('seed');
        if (seedInputElement) {
            seedInputElement.value = seed; // 更新输入框的值为当前种子值
        }
    }
}
// 监控文本框变化的函数
function setupTextareaMonitor() {
    let textarea = document.getElementById('tagarea');
    let timeout = null;
    let cursorPosition = 0; // 用于存储光标的位置

    // 处理文本变化的函数
    function handleTextChange() {
        let text = textarea.value;
        let lastSegment = getLastSegment(text, cursorPosition);

        if (lastSegment) {
            let url = `/novelai/suggest-tags?prompt=${encodeURIComponent(lastSegment)}`;
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    console.log('Tags:', data.tags);
                    // 调用displayTags函数来显示标签
                    displayTags(data.tags, lastSegment);
                })
                .catch(error => console.error('Error fetching tags:', error));
        }
    }

    // 获取用户编辑位置向前直到分隔符的文本段
    function getLastSegment(text, cursorPos) {
        let separators = [',', '{', '}', '(', ')', '[', ']', '\n'];
        let startIndex = 0;

        for (let i = cursorPos - 1; i >= 0; i--) {
            if (separators.includes(text[i])) {
                startIndex = i + 1;
                break;
            }
        }

        return text.substring(startIndex, cursorPos).trim();
    }

    // 为文本区域添加事件监听器
    textarea.addEventListener('input', (event) => {
        clearTimeout(timeout);
        cursorPosition = event.target.selectionStart;
        timeout = setTimeout(() => handleTextChange(), 600);
    });

    // 显示标签的函数
    function displayTags(tags, lastSegment) {
        // 找到目标容器
        const container = document.getElementById('tag-suggestions');

        // 清空之前的内容
        container.innerHTML = '';

        // 为每个tag创建一个span元素并应用样式
        tags.forEach(tag => {
            let span = document.createElement('span');
            span.textContent = tag.tag_name;
            span.style.cssText = "display: inline-block; border: 1px solid #d9d9d9; border-radius: 8px; padding: 5px 10px; margin-right: 10px; margin-bottom: 10px; cursor: pointer;";

            // 添加点击事件
            span.onclick = function() {
                // 替换文本框中最后一个匹配的分隔符后的文本段
                let replacedText = textarea.value.substring(0, cursorPosition - lastSegment.length) + tag.tag_name + textarea.value.substring(cursorPosition);
                textarea.value = replacedText;
                container.innerHTML = ''; // 清除其它所有span
            };

            // 将span元素添加到容器中
            container.appendChild(span);
        });
    }

    // 用于转义正则表达式中的特殊字符
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

}


// 当页面加载完成后，设置监控
window.addEventListener('load', setupTextareaMonitor);


function translateText() {
    let textToTranslate = document.getElementById('translatearea1').value; // 获取翻译文本

    // 确保文本非空
    if (!textToTranslate.trim()) {
        alert("请输入需要翻译的内容");
        return;
    }

    // 替换中文标点为英文标点，并移除特定字符
    textToTranslate = textToTranslate
        .replace(/，/g, ',') // 替换中文逗号
        .replace(/。/g, '.') // 替换中文句号
        .replace(/！/g, '!') // 替换中文感叹号
        .replace(/[{}()\/\\|\[\]]/g, ''); // 移除字符{}()/\|[]

    // 检测是否包含中文字符
    const containsChinese = /[\u4e00-\u9fa5]/.test(textToTranslate);
    let maxLength;

    if (containsChinese) {
        // 如果输入包含中文，仅限制字符数
        maxLength = 300; // 中文字符限制
        if (textToTranslate.length > maxLength) {
            alert("输入的中文内容不要超过300个字符");
            return;
        }
    } else {
        // 英文字符限制，这里不需要额外的长度检查，因为已经是处理后的文本
        maxLength = 1800;
        if (textToTranslate.length > maxLength) {
            alert("输入的英文内容不要超过1800字符");
            return;
        }
    }

    // 显示加载动画
    var index = layer.load(2, { // 1表示风格，可选0-2
        shade: [0.1, '#fff'] // 0.1透明度的白色背景
    });

    fetch('/api/translate', { // Flask API端点
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: textToTranslate
            }), // 发送的数据
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // 解析JSON数据
        })
        .then(data => {
            let translatedText = data.translated_text.replace(/[‘“"’”]/g, '');
            document.getElementById('translatearea2').value = translatedText; // 显示处理后的翻译结果
        })
        .catch((error) => {
            console.error('Error:', error);
            alert("翻译失败，请稍后再试。"); // 错误处理
        })
        .finally(() => {
            layer.close(index); // 无论成功还是失败，都关闭加载动画
        });
}

function base64ToFile(base64Data, filename) {
    // 将 base64 字符串转换为二进制字符串
    const byteString = atob(base64Data.split(',')[1]);
    // 获取 mime 类型
    const mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0];

    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([ab], {
        type: mimeString
    });
    return new File([blob], filename, {
        type: mimeString
    });
}

layui.use(['layer'], function() {
    var layer = layui.layer;

    // 监听点击事件
    document.getElementById('img-display').addEventListener('click', function() {
        // 打开弹出层
        layer.open({
            type: 1,
            title: '操作图片',
            content: '<div style="padding: 20px;">' +
                '<button class="layui-btn" id="upload-btn">上传到图床</button>' +
                '<button class="layui-btn" id="save-btn">保存到本地</button>' +
                '</div>',
            success: async function(layero, index) { // 注意这里使用 async
                var uploadBtn = document.getElementById('upload-btn');
                var saveBtn = document.getElementById('save-btn');

                // "上传到图床"按钮逻辑
                uploadBtn.addEventListener('click', async function() { // 注意这里使用 async
                    uploadBtn.disabled = true; // 立即禁用按钮
                    uploadBtn.classList.add("layui-btn-disabled");
                    var imgBase64 = document.querySelector('#img-display img').src;
                    var file = base64ToFile(imgBase64, "image.png"); // 转换 Base64 为文件对象

                    var formData = new FormData();
                    formData.append('image', file);

                    try {
                        // 尝试上传图片
                        const response = await fetch('/api/upload', { // 使用 await 等待fetch完成
                            method: 'POST',
                            body: formData
                        });

                        if (response.ok) {
                            const data = await response.json();
                            console.log(data);
                            layer.msg('图片上传成功,你可以在图床内查看你的图像了', {
                                icon: 1
                            }); // 显示成功消息
                            layer.close(index); // 关闭弹出层
                        } else if (response.status === 401) {
                            throw 'unauthorized';
                        } else {
                            throw new Error('Network response was not ok.');
                        }
                    } catch (error) {
                        if (error === 'unauthorized') {
                            // 如果未授权，则请求token
                            layer.prompt({
                                formType: 1,
                                value: '',
                                title: '请输入Token'
                            }, function(value, promptIndex) {
                                formData.append('token', value); // 添加token到表单数据中
                                // 再次尝试上传图片
                                fetch('/api/upload', {
                                        method: 'POST',
                                        body: formData
                                    }).then(layer.close(promptIndex)) // 关闭token输入的弹出层)
                                    .then(response => response.json())
                                    .then(data => {
                                        console.log(data);
                                        layer.msg('图片上传成功,你可以在图床内查看你的图像了', {
                                            icon: 1
                                        });
                                        layer.close(promptIndex); // 关闭token输入的弹出层
                                        layer.close(index); // 关闭操作图片的弹出层
                                    }).catch(error => {
                                        console.error('There has been a problem with your fetch operation:', error);
                                        layer.msg('上传失败', {
                                            icon: 2
                                        });
                                        layer.close(promptIndex); // 关闭token输入的弹出层
                                        layer.close(index); // 关闭操作图片的弹出层
                                    });
                            });
                            layer.alert('请按照以下步骤获取Token：<br>' +
                                '1. 访问 <a href="https://imgtp.com/" target="_blank">https://imgtp.com/</a> 并注册账号。<br>' +
                                '2. 注册并登录后，进入到用户设置中找到API Token。<br>' +
                                '3. 复制并返回此处粘贴Token。<br>' +
                                '4. 如果需要修改token或者删除token，点击user，然后点击删除token。', {
                                    title: '获取Token教程'
                                });
                        } else {
                            console.error('There has been a problem with your fetch operation:', error);
                            layer.msg('上传失败', {
                                icon: 2
                            }); // 显示错误消息
                            layer.close(index); // 关闭弹出层
                        }
                    } finally {
                        uploadBtn.disabled = false; // 重置按钮状态
                        uploadBtn.classList.remove("layui-btn-disabled");
                    }
                });
                // "保存到本地"按钮逻辑
                saveBtn.addEventListener('click', function() {
                    saveBtn.disabled = true; // 立即禁用按钮
                    var imgBase64 = document.querySelector('#img-display img').src;

                    // 生成随机字符串作为文件名
                    var randomFileName = Math.random().toString(36).substring(2, 18);

                    var link = document.createElement('a');
                    link.href = imgBase64;
                    link.download = randomFileName + '.png'; // 设置文件名和扩展名
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    layer.close(index); // 关闭弹出层
                    saveBtn.disabled = false; // 重置按钮状态
                });
            }
        });
    });
});

layui.use(['layer'], function() {
    var layer = layui.layer;

    // 监听按钮点击事件
    document.getElementById('prompt_upload').addEventListener('click', function() {
        // 弹窗要求用户输入文本标题
        layer.prompt({
            formType: 0,
            value: '',
            title: '请输入文本标题',
            success: function(layero) {
                var input = layero.find('.layui-layer-input');
                input.attr('maxlength', 10); // 限制最大输入字符数为10
            }
        }, function(value, index, elem) {
            var title = value; // 用户输入的标题
            var text1 = document.getElementById('tagarea').value;
            var text2 = document.getElementById('tagarea2').value;

            // 发送数据到后端的代码
            fetch('/api/save_texts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title: title,
                        text_content1: text1,
                        text_content2: text2
                    })
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Success:', data);
                    layer.close(index); // 关闭弹窗
                    layer.msg('上传成功,你可以在词条笔记本中查看你的词条了', {
                        icon: 1
                    }); // 显示成功消息
                })
                .catch((error) => {
                    console.error('Error:', error);
                    layer.msg('上传失败');
                });
        });
    });

});

layui.use(['form'], function(){
    var form = layui.form;
    // 监听提交
    form.on('submit(formDemo)', function(data){
        layer.msg(JSON.stringify(data.field));
        return false;
    });
});

function updateStatusText() {
    var statusText = document.getElementById('statusText');
    switch(defry) {
        case 0:
            statusText.textContent = 'Normal';
            break;
        case 1:
            statusText.textContent = 'Slightly Weak';
            break;
        case 2:
            statusText.textContent = 'Weak';
            break;
        case 3:
            statusText.textContent = 'Even Weaker';
            break;
        case 4:
            statusText.textContent = 'Very Weak';
            break;
        case 5:
            statusText.textContent = 'Weakest';
            break;
    }
}

document.getElementById('decrementBtn').addEventListener('click', function() {
    if (defry > 0) {
        defry--;
        updateStatusText();
    }
});

document.getElementById('incrementBtn').addEventListener('click', function() {
    if (defry < 5) {
        defry++;
        updateStatusText();
    }
});

// 初始化文本
updateStatusText();
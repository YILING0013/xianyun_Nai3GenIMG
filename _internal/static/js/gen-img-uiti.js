document.getElementById('downloadAll').addEventListener('click', async function() {
    if (window.Worker) {
        let zip = new JSZip();
        let images = document.getElementById('img-preview').getElementsByTagName('img');
        let imageUrls = [];
        let base64Images = [];

        for (let i = 0; i < images.length; i++) {
            let img = images[i];
            if (img.src.startsWith('data:image')) {
                base64Images.push({ src: img.src, fileName: 'image' + (i + 1) + '.png' });
            } else if (img.src.startsWith('http')) {
                imageUrls.push({ src: img.src, fileName: 'image' + (i + 1) + '.png' });
            }
        }

        // 创建Worker处理图像下载和打包
        let worker = new Worker('static/js/worker.js');
        worker.postMessage({ base64Images, imageUrls });

        worker.onmessage = function(event) {
            let { blobs } = event.data;
            blobs.forEach(blobData => {
                zip.file(blobData.fileName, blobData.blob);
            });

            zip.generateAsync({ type: 'blob' }).then(function(content) {
                saveAs(content, 'images.zip');
            });
        };
    } else {
        alert('Your browser does not support Web Workers.');
    }
});

document.addEventListener('DOMContentLoaded', (event) => {
    // 页面加载时执行
    if (localStorage.getItem('tagarea')) {
        document.getElementById('tagarea').value = localStorage.getItem('tagarea');
    }
    if (localStorage.getItem('tagarea2')) {
        document.getElementById('tagarea2').value = localStorage.getItem('tagarea2');
    }

    // 为 tagarea 元素添加事件监听器
    document.getElementById('tagarea').addEventListener('input', function() {
        // 当用户更改文本时，保存数据到 localStorage
        localStorage.setItem('tagarea', this.value);
    });

    // 为 tagarea2 元素添加事件监听器
    document.getElementById('tagarea2').addEventListener('input', function() {
        // 当用户更改文本时，保存数据到 localStorage
        localStorage.setItem('tagarea2', this.value);
    });
});

document.getElementById('expandableTrigger').addEventListener('click', function() {
    var uploadArea = document.getElementById("uploadArea");
    if (uploadArea.style.display === "none") {
        uploadArea.style.display = "block";
    } else {
        uploadArea.style.display = "none";
    }
});

function fetchAndProcessData() {
    fetch('/api/select_random', {
        method: 'GET',
    })
    .then(response => response.json())
    .then(data => {
        // data 现在是一个有序列表
        const tags = data.join(', ');
        document.getElementById('tagarea').value = tags;
    })
    .catch(error => console.error('Error:', error));
}

layui.use('element', function(){
    var element = layui.element;
    
    // 监听选项卡切换事件
    element.on('tab(demoTab)', function(data){
        // 隐藏所有按钮
        document.querySelectorAll('.layui-tab-title li button').forEach(function(btn){
            btn.style.display = 'none';
        });
        
        // 根据选中的选项卡显示按钮
        var activeTab = this; // 当前激活的选项卡
        if(activeTab.getAttribute('lay-id') === '11' || activeTab.getAttribute('lay-id') === '33'){
            // activeTab.querySelector('button').style.display = 'inline-block';
            // 如果有多个按钮，可以使用下面的方式
            activeTab.querySelectorAll('button').forEach(function(btn){
                btn.style.display = 'inline-block';
            });
        }
    });
    
    // 默认显示第一个选项卡的多个按钮
    document.querySelector('.layui-tab-title li').querySelectorAll('button').forEach(function(btn){
        btn.style.display = 'inline-block';
    });
});

layui.use(['layer', 'miniTab','echarts'], function () {
    var $ = layui.jquery,
        layer = layui.layer,
        miniTab = layui.miniTab,
        echarts = layui.echarts;

    miniTab.listen();
    $('body').on('click', '.layuimini-notice', function () {
        var title = $(this).children('.layuimini-notice-title').text(),
            noticeTime = $(this).children('.layuimini-notice-extra').text(),
            content = $(this).children('.layuimini-notice-content').html();
        var html = '<div style="padding:15px 20px; text-align:justify; line-height: 22px;border-bottom:1px solid #e2e2e2;background-color: #2f4056;color: #ffffff">\n' +
            '<div style="text-align: center;margin-bottom: 20px;font-weight: bold;border-bottom:1px solid #b5d5ff;padding-bottom: 5px"><h4 class="text-danger">' + title + '</h4></div>\n' +
            '<div style="font-size: 12px">' + content + '</div>\n' +
            '</div>\n';
        parent.layer.open({
            type: 1,
            title: '系统公告'+'<span style="float: right;right: 1px;font-size: 12px;color: #b1b3b9;margin-top: 1px">'+noticeTime+'</span>',
            area: '300px;',
            shade: 0.8,
            id: 'layuimini-notice',
            btn: ['取消'],
            btnAlign: 'c',
            moveType: 1,
            content:html,
            success: function (layero) {
                var btn = layero.find('.layui-layer-btn');
                btn.find('.layui-layer-btn1').attr({
                    href: 'https://space.bilibili.com/487156342',
                    target: '_blank'
                });
            }
        });
    });

    // echartsRecords.setOption(optionRecords);

    // echarts 窗口缩放自适应
    window.onresize = function(){
        echartsRecords.resize();
    }

    $(document).ready(function() {
        $('#prompt_notebook').on('click', function() {
            fetchTexts();
        });
    });
    
    function fetchTexts() {
        $.ajax({
            url: '/api/get_texts', // 修改为你的实际API路径
            type: 'GET',
            success: function(response) {
                showLayer(response.texts);
            },
            error: function(xhr) {
                console.error('An error occurred: ' + xhr.status + ' ' + xhr.statusText);
            }
        });
    }
    
    function showLayer(texts) {
        var content = '<div class="custom-layer-container"><div class="custom-sidebar">';
        texts.forEach(function(text, index) {
            content += '<button onclick="showTextGroup(' + (index+1) + ')">' + text.title + '</button>';
        });
        content += '</div><div class="custom-content">';
        texts.forEach(function(text, index) {
            content += '<div id="group' + (index+1) + '_text1" class="custom-text-box" style="display: none;">' +
                       '<p>' + text.text_content1 + '</p></div>';
            content += '<div id="group' + (index+1) + '_text2" class="custom-text-box" style="display: none;">' +
                       '<p>' + text.text_content2 + '</p></div>';
            content += '<button id="delete' + (index+1) + '_text" onclick="deleteText(\'' + text.title + '\', ' + (index+1) + ')" style="display: none;">删除</button>';
            content += '<button id="add' + (index+1) + '_text" onclick="add(\'' + text.title + '\', ' + (index+1) + ')" style="display: none;">添加到绘图Tag</button>';
        });
        content += '</div></div>';
    
        layui.use('layer', function() {
            var layer = layui.layer;
            var areaSize = '50%';
            if (window.matchMedia("(max-width: 768px)").matches) {
                // On screens that are 768px or less, set area to 100% to make it full screen
                areaSize = '100%';
            }
            layer.open({
                type: 1,
                title: '词条笔记本',
                area: [areaSize, '100%'],
                offset: 'rt',
                shade: 0.6,
                shadeClose: true,
                content: content
            });
        });
    }
    
});

var $ = layui.jquery;

function showTextGroup(groupIndex) {
    $('.custom-text-box').hide(); // 隐藏所有文本框
    $('button[onclick^="deleteText"]').hide(); // 隐藏所有删除按钮
    $('button[onclick^="add"]').hide(); 
    $('#group' + groupIndex + '_text1').show(); // 显示第一段文本
    $('#group' + groupIndex + '_text2').show(); // 显示第二段文本
    $('#delete' + groupIndex + '_text').show(); // 显示对应的删除按钮
    $('#add' + groupIndex + '_text').show(); // 显示对应的添加按钮
}

function deleteText(title, button) {
    $.ajax({
        url: '/api/delete_text', // 适当修改为你的实际API路径
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ title: title }),
        success: function(response) {
            $(button).parent().remove(); // 删除按钮和标题按钮的容器
            $('#group' + title).remove(); // 删除对应的文本框
            alert('删除成功,将在下次打开时移除'); // 或使用更复杂的消息提示方法
        },
        error: function(xhr) {
            console.error('删除失败: ' + xhr.status + ' ' + xhr.statusText);
        }
    });
}

function add(title, groupIndex) {
    // 获取两个文本框的内容
    var text1 = $('#group' + groupIndex + '_text1').text();
    var text2 = $('#group' + groupIndex + '_text2').text();

    // 将获取到的文本设置到对应的textarea中
    $('#tagarea').val(text1);   // 清空并放入文本1
    $('#tagarea2').val(text2);  // 清空并放入文本2
}


document.addEventListener('DOMContentLoaded', function() {
    var textarea = document.getElementById("tagarea");
    var contextMenu = document.getElementById("custom-context-menu");

    // 显示自定义右键菜单
    function showContextMenu(x, y) {
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.style.display = 'block';
    }
    // 检查是否为移动设备
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    document.addEventListener("click", function(e) {
        contextMenu.style.display = 'none';
    });

    // 如果是移动设备，则移除右键菜单功能
    if (isMobileDevice()) {
        textarea.removeEventListener("contextmenu", function(e) {
            e.preventDefault();
        });
    } else {
        // 添加右键菜单功能
        textarea.addEventListener("contextmenu", function(e) {
            e.preventDefault();
            showContextMenu(e.pageX, e.pageY);
            return false;
        });
    }

    // 加权函数
    window.increaseWeight = function() {
        var text = textarea.value;
        var start = textarea.selectionStart;
        var end = textarea.selectionEnd;
        var selectedText = text.substring(start, end);

        var regex = /\[(.*?)\]/;
        if (regex.test(selectedText)) {
            selectedText = selectedText.replace(regex, "$1");
        } else {
            selectedText = "{" + selectedText + "}";
        }
        textarea.value = text.substring(0, start) + selectedText + text.substring(end);
    };

    // 降权函数
    window.decreaseWeight = function() {
        var text = textarea.value;
        var start = textarea.selectionStart;
        var end = textarea.selectionEnd;
        var selectedText = text.substring(start, end);

        var regex = /\{(.*?)\}/;
        if (regex.test(selectedText)) {
            selectedText = selectedText.replace(regex, "$1");
        } else {
            selectedText = "[" + selectedText + "]";
        }
        textarea.value = text.substring(0, start) + selectedText + text.substring(end);
    };

    window.annotateText = function() {
        var text = textarea.value;
        var start = textarea.selectionStart;
        var end = textarea.selectionEnd;
        var selectedText = text.substring(start, end);
        if (selectedText) {
            textarea.value = text.substring(0, start) + "/*" + selectedText + "*/" + text.substring(end);
        }
    };

    window.unannotateText = function() {
        var text = textarea.value;
        var start = textarea.selectionStart;
        var end = textarea.selectionEnd;
        var selectedText = text.substring(start, end);
        var regex = /\/\*(.*?)\*\//g;
        textarea.value = text.substring(0, start) + selectedText.replace(regex, "$1") + text.substring(end);
    };
    document.getElementById('copy_prompt').addEventListener('click', function() {
        // 获取textarea中选中的文本
        var start = textarea.selectionStart;
        var end = textarea.selectionEnd;
        var selectedText = textarea.value.substring(start, end);
    
        // 使用Clipboard API写入剪切板
        navigator.clipboard.writeText(selectedText).then(function() {
            layer.msg('复制成功');
            // 隐藏上下文菜单
            contextMenu.style.display = 'none';
        }, function(err) {
            layer.msg('复制失败:', err);
        });
    });
    
    document.getElementById('paste_prompt').addEventListener('click', function() {
        // 从剪切板读取文本
        navigator.clipboard.readText().then(function(text) {
            // 插入文本到当前光标位置
            var start = textarea.selectionStart;
            var end = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, start) + text + textarea.value.substring(end);
            // 更新光标位置
            textarea.selectionStart = textarea.selectionEnd = start + text.length;
            // 隐藏上下文菜单
            contextMenu.style.display = 'none';
            layer.msg('粘贴成功');
        }).catch(function(err) {
            layer.msg('粘贴失败:', err);
        });
    });

    document.getElementById('cut_prompt').addEventListener('click', function() {
        // 获取textarea中选中的文本
        var start = textarea.selectionStart;
        var end = textarea.selectionEnd;
        var selectedText = textarea.value.substring(start, end);
    
        // 使用Clipboard API写入剪切板
        navigator.clipboard.writeText(selectedText).then(function() {
            layer.msg('剪切成功');
            // 从textarea中删除选中的文本
            textarea.value = textarea.value.substring(0, start) + textarea.value.substring(end);
            // 更新光标位置
            textarea.selectionStart = textarea.selectionEnd = start;
            // 隐藏上下文菜单
            contextMenu.style.display = 'none';
        }, function(err) {
            layer.msg('剪切失败:', err);
        });
    });
    

    document.getElementById('select-all').addEventListener('click', function() {
        // 选中textarea中的所有文本
        textarea.select();
        
        // 隐藏上下文菜单
        contextMenu.style.display = 'none';
    });
    
    
});

document.addEventListener('DOMContentLoaded', function() {
    var userOpus = sessionStorage.getItem('userOpus');
    if (userOpus !== null) {
        var userOpusElement = document.getElementById('userOpus');
        userOpusElement.innerHTML = 'Opus: ' + userOpus;
    }
});

layui.use(['jquery'], function(){
    var $ = layui.jquery;
    var button = $('#select_random');
    var randomTagDiv = $('#Random_Tag');

    button.on('click', function() {
        if (randomTagDiv.is(':hidden')) {
            randomTagDiv.show();
        } else {
            randomTagDiv.hide();
        }
    });
});

layui.use(function(){
  var form = layui.form;
  var layer = layui.layer;
  // checkbox 事件
  form.on('checkbox(Auto_random)', function(data){
    var elem = data.elem; // 获得 checkbox 原始 DOM 对象
    if(elem.checked==true){
        $("input[name='Auto_polling']").prop("checked", false);
        form.render("checkbox");
    }
    
  });
  form.on('checkbox(Auto_polling)', function(data){
    var elem = data.elem; // 获得 checkbox 原始 DOM 对象
    if(elem.checked==true){
        $("input[name='Auto_random']").prop("checked", false);
        form.render("checkbox");
    }
  });
});

document.addEventListener('keydown', function(event) {
    // 检查事件的目标元素是否是输入框或可编辑区域
    const tagName = event.target.tagName.toLowerCase();
    const brushSizeInput = document.getElementById('brushSize');
    const currentSize = parseInt(brushSizeInput.value);
    if (tagName === 'input' || tagName === 'textarea' || event.target.isContentEditable) {
        return; // 如果是输入框或可编辑区域，直接返回，不触发快捷键
    }

    // 根据按键执行相应操作
    switch(event.key) {
        case 's': // S for export
            document.getElementById('exportMask').click();
            break;
        case 'b': // b for remove background
            if (event.ctrlKey) {
                document.getElementById('remove_background').click();
            }
            break;
        case 'z': // Ctrl+Z for undo
            if (event.ctrlKey) {
                document.getElementById('undoBtn').click();
            }
            break;
        case 'y': // Ctrl+Y for redo
            if (event.ctrlKey) {
                document.getElementById('redoBtn').click();
            }
            break;
        case 'c': // c for clear
            document.getElementById('clearBtn').click();
            break;
        case 'e': // r for eraser
            document.getElementById('eraserBtn').click();
            break;
        case 'i': // p for pencil
            document.getElementById('colorPickerBtn').click();
            break;
        case '=': // ↑ 增大画笔大小
            if (currentSize < parseInt(brushSizeInput.max)) {
                brushSizeInput.value = currentSize + 1;
            }
            break;
        case '-': // ↓ 减小画笔大小
            if (currentSize > parseInt(brushSizeInput.min)) {
                brushSizeInput.value = currentSize - 1;
            }
            break;
        default:
            break;
    }
});
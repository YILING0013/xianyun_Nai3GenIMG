layui.use(['table', 'jquery', 'form', 'layer', 'element'], function(){
    var table = layui.table;
    var $ = layui.jquery;
    var form = layui.form;
    var layer = layui.layer;
    var element = layui.element;

    var illustratorsData = [];
    var entryTableData = [];
    var customEntryData = {}; // 字典用于存储每个选项卡的词条数据
    var tagGroupData = {}; // 字典用于存储每个词条组选项卡的词条数据
    var playerData = {}; // 字典用于存储每个角色选项卡的词条数据

    // Load and render illustrator table
    $.getJSON('/json/Illustrator.json', function(data) {
        var illustrators = data.画师;
        var id = 1;

        for (var key in illustrators) {
            if (illustrators.hasOwnProperty(key)) {
                illustratorsData.push({
                    id: id++,
                    english: illustrators[key],
                    disabled: false
                });
            }
        }

        table.render({
            elem: '#illustratorTable',
            cols: [[
                {field: 'id', title: 'ID', width: 80, sort: true},
                {field: 'english', title: '画师名', width: 600},
                {field: 'delete', title: '操作', width: 80, templet: '#deleteBtnTpl'}
            ]],
            data: illustratorsData,
            page: true,
            done: function() {
                $('#illustratorCount').attr('max', illustratorsData.length);
            }
        });
    });

    function loadJson(filePath, callback) {
        $.getJSON(filePath, function(data) {
            callback(data);
        }).fail(function() {
            console.error('Failed to load ' + filePath);
        });
    }

    function initialize() {
        loadJson('/json/customEntries.json', function(data) {
            data.forEach(function(tabData) {
                var tabId = tabData.tabId;
                var tabTitle = tabData.tabName;
                customEntryData[tabId] = tabData.entries;

                element.tabAdd('test-handle', {
                    title: tabTitle,
                    content: '<div class="control-container line-wrap">' +
                        '<label for="Rescale-input" class="control-label">抽取个数:</label>' +
                        '<input type="number" id="entryCount' + tabId + '" placeholder="自定义词条数量" class="layui-input" min="0" value="1">' +
                        '<label for="Rescale-input" class="control-label">自定义词条(逗号分隔):</label>' +
                        '<textarea id="entryInput' + tabId + '" placeholder="Enter a custom combination of custom terms, using commas to separate each Tag" class="layui-textarea" style="min-height: 30px;"></textarea>' +
                        '<button class="layui-btn layui-btn-primary layui-btn-sm" onclick="generateTable(' + tabId + ')">生成词条表格</button>' +
                        '</div>' +
                        '<hr class="ws-space-16">' +
                        '<div>' +
                        '<table id="entryTable' + tabId + '" lay-filter="entryTable"></table>' +
                        '</div>',
                    id: tabId
                });

                table.render({
                    elem: '#entryTable' + tabId,
                    cols: [[
                        { field: 'id', title: 'ID', width: 80, sort: true },
                        { field: 'entry', title: '词条', width: 460 },
                        { field: 'delete', title: '操作', width: 80, templet: '#deleteBtnTpl' }
                    ]],
                    data: tabData.entries,
                    page: true
                });

                $('#entryCount' + tabId).attr('max', tabData.entries.length);
            });
        });

        loadJson('/json/tagGroups.json', function(data) {
            data.forEach(function(tagGroupDataItem) {
                var tabId = tagGroupDataItem.tabId;
                var tabTitle = tagGroupDataItem.tabName;
                tagGroupData[tabId] = tagGroupDataItem.entries;

                element.tabAdd('test-handle', {
                    title: tabTitle,
                    content: '<div class="control-container line-wrap">' +
                        '<label for="Rescale-input" class="control-label">自定义词条组:</label>' +
                        '<textarea id="tagGroupInput' + tabId + '" placeholder="Enter custom terms, one per line" class="layui-textarea" style="min-height: 100px;"></textarea>' +
                        '<button class="layui-btn layui-btn-primary layui-btn-sm" onclick="generateTagGroupTable(' + tabId + ')">生成词条组表格</button>' +
                        '</div>' +
                        '<hr class="ws-space-16">' +
                        '<div>' +
                        '<table id="tagGroupTable' + tabId + '" lay-filter="tagGroupTable"></table>' +
                        '</div>',
                    id: tabId
                });

                table.render({
                    elem: '#tagGroupTable' + tabId,
                    cols: [[
                        { field: 'id', title: 'ID', width: 80, sort: true },
                        { field: 'entry', title: '词条', width: 460 },
                        { field: 'delete', title: '操作', width: 80, templet: '#deleteBtnTpl' }
                    ]],
                    data: tagGroupDataItem.entries,
                    page: true
                });

                $('#entryCount' + tabId).attr('max', tagGroupDataItem.entries.length);
            });
        });

        loadJson('/json/playerConfig.json', function(data) {
            data.forEach(function(playerDataItem) {
                var tabId = playerDataItem.tabId;
                var tabTitle = playerDataItem.tabName;
                playerData[tabId] = playerDataItem.entries;

                element.tabAdd('test-handle', {
                    title: tabTitle,
                    content: '<div class="control-container line-wrap">' +
                        '<div class="layui-form">' +
                        '<input type="checkbox" name="insertBeforeIllustrator' + tabId + '" title="放于最前">' +
                        '</div>' +
                        '<label for="Rescale-input" class="control-label">自定义角色词条:</label>' +
                        '<textarea id="playerInput' + tabId + '" placeholder="Enter custom terms, separated by commas" class="layui-textarea" style="min-height: 30px;"></textarea>' +
                        '<button class="layui-btn layui-btn-primary layui-btn-sm" onclick="generatePlayerTable(' + tabId + ')">生成角色表格</button>' +
                        '</div>' +
                        '<hr class="ws-space-16">' +
                        '<div>' +
                        '<table id="playerTable' + tabId + '" lay-filter="playerTable"></table>' +
                        '</div>',
                    id: tabId
                });

                table.render({
                    elem: '#playerTable' + tabId,
                    cols: [[
                        { field: 'id', title: 'ID', width: 80, sort: true },
                        { field: 'entry', title: '词条', width: 460 },
                        { field: 'delete', title: '操作', width: 80, templet: '#deleteBtnTpl' }
                    ]],
                    data: playerDataItem.entries,
                    page: true
                });
                form.render("checkbox");
                $('#entryCount' + tabId).attr('max', playerDataItem.entries.length);
            });
        });
    }

    // Call initialize function on page load
    $(document).ready(function() {
        initialize();
    });

    // Listen for delete button click
    table.on('tool(illustratorTable)', function(obj){
        var data = obj.data;
        if (obj.event === 'delete') {
            obj.del(); // 删除对应行（tr）的DOM结构，并更新缓存
            illustratorsData = illustratorsData.filter(item => item.id !== data.id);
            $('#illustratorCount').attr('max', illustratorsData.length);
        }
    });

    // 自定义画师处理
    $('#generateTableBtn').on('click', function() {
        var entryInput = $('#entryInput').val();
        var splitArtist = $("input[name='Split_artist']").is(':checked');
        var entries = splitArtist ? entryInput.split(',') : [entryInput];
        var id = 1;
    
        // 清空 entryTableData
        entryTableData = [];
    
        entries.forEach(function(entry) {
            entryTableData.push({
                id: id++,
                entry: entry.trim(),
                disabled: false
            });
        });
    
        table.render({
            elem: '#entryTable',
            cols: [[
                {field: 'id', title: 'ID', width: 80, sort: true},
                {field: 'entry', title: '词条', width: 460},
                {field: 'delete', title: '操作', width: 80, templet: '#deleteBtnTpl'}
            ]],
            data: entryTableData,
            page: true,
            done: function() {
                $('#entryCount').attr('max', entryTableData.length);
            }
        });
    });
    
    // Listen for delete button click for entryTable
    table.on('tool(entryTable)', function(obj){
        var data = obj.data;
        if (obj.event === 'delete') {
            obj.del(); // 删除对应行（tr）的DOM结构，并更新缓存
            entryTableData = entryTableData.filter(item => item.id !== data.id);
            $('#entryCount').attr('max', entryTableData.length);
        }
    });    

    // Monitor input fields for max value
    $('#entryCount').on('input', function() {
        var max = parseInt($('#entryCount').attr('max'));
        var value = parseInt($(this).val());
        if (value > max) {
            $(this).val(max);
        }
    });

    $('#illustratorCount').on('input', function() {
        var max = parseInt($('#illustratorCount').attr('max'));
        var value = parseInt($(this).val());
        if (value > max) {
            $(this).val(max);
        }
    });

    $('#illustratorMinCount').on('input', function() {
        var max = parseInt($('#illustratorCount').attr('max'));
        var value = parseInt($(this).val());
        if (value > max) {
            $(this).val(max);
        }
    });

    // 导出按钮的点击事件
    $('#exportTabBtn').on('click', function() {
        var dataToExport = [];

        $('.layui-tab-title li').each(function() {
            var tabId = $(this).attr('lay-id');
            var tabName = $(this).text();

            if (customEntryData[tabId]) {
                dataToExport.push({
                    tabId: tabId,
                    tabName: tabName,
                    entries: customEntryData[tabId]
                });
            }
        });

        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport));
        var downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "customEntries.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });

    // 导入按钮的点击事件
    $('#importBtn').on('click', function() {
        $('#importFile').click();
    });

    $('#importFile').on('change', function(event) {
        var file = event.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var content = e.target.result;
                var importedData = JSON.parse(content);

                importedData.forEach(function(tabData) {
                    // 重新创建选项卡
                    var tabId = tabData.tabId;
                    var tabTitle = tabData.tabName;
                    customEntryData[tabId] = tabData.entries;

                    element.tabAdd('test-handle', {
                        title: tabTitle,
                        content: '<div class="control-container line-wrap">' +
                            '<label for="Rescale-input" class="control-label">抽取个数:</label>' +
                            '<input type="number" id="entryCount' + tabId + '" placeholder="自定义词条数量" class="layui-input" min="0" value="1">' +
                            '<label for="Rescale-input" class="control-label">自定义词条(逗号分隔):</label>' +
                            '<textarea id="entryInput' + tabId + '" placeholder="Enter a custom combination of custom terms, using commas to separate each Tag" class="layui-textarea" style="min-height: 30px;"></textarea>' +
                            '<button class="layui-btn layui-btn-primary layui-btn-sm" onclick="generateTable(' + tabId + ')">生成词条表格</button>' +
                            '</div>' +
                            '<hr class="ws-space-16">' +
                            '<div>' +
                            '<table id="entryTable' + tabId + '" lay-filter="entryTable"></table>' +
                            '</div>',
                        id: tabId
                    });

                    table.render({
                        elem: '#entryTable' + tabId,
                        cols: [[
                            { field: 'id', title: 'ID', width: 80, sort: true },
                            { field: 'entry', title: '词条', width: 460 },
                            { field: 'delete', title: '操作', width: 80, templet: '#deleteBtnTpl' }
                        ]],
                        data: tabData.entries,
                        page: true
                    });

                    // 更新抽取个数输入框的最大值
                    $('#entryCount' + tabId).attr('max', tabData.entries.length);
                });

                layer.msg('导入成功');
            };
            reader.readAsText(file);
        }
        $('#importFile').val(''); // 重置文件输入框
    });

    // 导出词条组按钮的点击事件
    $('#exportTagGroupBtn').on('click', function() {
        var dataToExport = [];

        $('.layui-tab-title li').each(function() {
            var tabId = $(this).attr('lay-id');
            var tabName = $(this).text();

            if (tagGroupData[tabId]) {
                dataToExport.push({
                    tabId: tabId,
                    tabName: tabName,
                    entries: tagGroupData[tabId]
                });
            }
        });

        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport));
        var downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "tagGroups.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });

    // 导入词条组按钮的点击事件
    $('#importTagGroupBtn').on('click', function() {
        $('#importTagGroupFile').click();
    });

    $('#importTagGroupFile').on('change', function(event) {
        var file = event.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var content = e.target.result;
                var importedData = JSON.parse(content);

                importedData.forEach(function(tagGroupDataItem) {
                    // 重新创建选项卡
                    var tabId = tagGroupDataItem.tabId;
                    var tabTitle = tagGroupDataItem.tabName;
                    tagGroupData[tabId] = tagGroupDataItem.entries;

                    element.tabAdd('test-handle', {
                        title: tabTitle,
                        content: '<div class="control-container line-wrap">' +
                            '<label for="Rescale-input" class="control-label">自定义词条组:</label>' +
                            '<textarea id="tagGroupInput' + tabId + '" placeholder="Enter custom terms, one per line" class="layui-textarea" style="min-height: 100px;"></textarea>' +
                            '<button class="layui-btn layui-btn-primary layui-btn-sm" onclick="generateTagGroupTable(' + tabId + ')">生成词条组表格</button>' +
                            '</div>' +
                            '<hr class="ws-space-16">' +
                            '<div>' +
                            '<table id="tagGroupTable' + tabId + '" lay-filter="tagGroupTable"></table>' +
                            '</div>',
                        id: tabId
                    });

                    table.render({
                        elem: '#tagGroupTable' + tabId,
                        cols: [[
                            { field: 'id', title: 'ID', width: 80, sort: true },
                            { field: 'entry', title: '词条', width: 460 },
                            { field: 'delete', title: '操作', width: 80, templet: '#deleteBtnTpl' }
                        ]],
                        data: tagGroupDataItem.entries,
                        page: true
                    });

                    // 更新抽取个数输入框的最大值
                    $('#entryCount' + tabId).attr('max', tagGroupDataItem.entries.length);
                });

                layer.msg('导入成功');
            };
            reader.readAsText(file);
        }
        $('#importTagGroupFile').val(''); // 重置文件输入框
    });

    // 生成表格的函数
    window.generateTable = function(tabId) {
        var entryInput = $('#entryInput' + tabId).val();
        var entries = entryInput.split(',').filter(entry => entry.trim() !== '');
        var entryTableData = [];

        entries.forEach(function(entry, index) {
            entryTableData.push({
                id: index + 1,
                entry: entry.trim(),
                disabled: false
            });
        });

        table.render({
            elem: '#entryTable' + tabId,
            cols: [[
                {field: 'id', title: 'ID', width: 80, sort: true},
                {field: 'entry', title: '词条', width: 460},
                {field: 'delete', title: '操作', width: 80, templet: '#deleteBtnTpl'}
            ]],
            data: entryTableData,
            page: true
        });

        // 保存当前表格数据到字典中，以便在抽取时使用
        customEntryData[tabId] = entryTableData;

        // Monitor input fields for max value
        $('#entryCount' + tabId).on('input', function() {
            var max = customEntryData[tabId].length;
            var value = parseInt($(this).val());
            if (value > max) {
                $(this).val(max);
            }
        });
    };

    // 随机加权和降权函数
    function applyRandomWeight(entry) {
        var randomWeightEnabled = $("input[name='Random_checkbox']").is(':checked');
        if (!randomWeightEnabled) {
            return entry;
        }

        function applyWeight(entry, isIncrease) {
            var weightSymbol = isIncrease ? '{' : '[';
            var closingSymbol = isIncrease ? '}' : ']';
            return weightSymbol + entry + closingSymbol;
        }

        function randomizeWeight(entry, isIncrease) {
            var newEntry = applyWeight(entry, isIncrease);
            for (var i = 0; i < 3; i++) {
                if (Math.random() < 1 / 3) {
                    newEntry = applyWeight(newEntry, isIncrease);
                }
            }
            return newEntry;
        }

        var rand = Math.random();
        if (rand < 1 / 6) {
            return randomizeWeight(entry, true);  // 加权
        } else if (rand < 2 / 6) {
            return randomizeWeight(entry, false); // 降权
        } else {
            return entry; // 无操作
        }
    }

    // Helper function to get random items
    function getRandomItems(arr, count, field) {
        var shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
        while (i-- > min) {
            index = Math.floor((i + 1) * Math.random());
            temp = shuffled[index];
            shuffled[index] = shuffled[i];
            shuffled[i] = temp;
        }
        return shuffled.slice(min).map((item, idx) => ({
            id: idx + 1,
            entry: applyRandomWeight(item[field]),
            disabled: false
        }));
    }

    // Helper function to shuffle array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    


    // 添加新的选项卡
    $('#addTabBtn').on('click', function() {
        layer.prompt({title: '输入新类别名称', formType: 0}, function(value, index){
            var tabId = new Date().getTime(); // 使用时间戳作为唯一ID
            customEntryData[tabId] = []; // 初始化字典中的键值

            element.tabAdd('test-handle', {
                title: value,
                content: '<div class="control-container line-wrap">' +
                            '<label for="Rescale-input" class="control-label">抽取个数:</label>' +
                            '<input type="number" id="entryCount' + tabId + '" placeholder="自定义词条数量" class="layui-input" min="0">' +
                            '<label for="Rescale-input" class="control-label">自定义词条(逗号分隔):</label>' +
                            '<textarea id="entryInput' + tabId + '" placeholder="Enter a custom combination of custom terms, using commas to separate each Tag" class="layui-textarea" style="min-height: 30px;"></textarea>' +
                            '<button class="layui-btn layui-btn-primary layui-btn-sm" onclick="generateTable(' + tabId + ')">生成词条表格</button>' +
                          '</div>' +
                          '<hr class="ws-space-16">' +
                          '<div>' +
                            '<table id="entryTable' + tabId + '" lay-filter="entryTable"></table>' +
                          '</div>',
                id: tabId
            });
            element.tabChange('test-handle', tabId); // 切换到新选项卡
            layer.close(index);
        });
    });

    // 添加轮询词条串选项卡
    $('#addTagGroupBtn').on('click', function() {
        layer.prompt({title: '输入词条组名称', formType: 0}, function(value, index){
            var tabId = new Date().getTime(); // 使用时间戳作为唯一ID
            var tabTitle = '词条组-' + value;
            tagGroupData[tabId] = []; // 初始化词条组数据

            element.tabAdd('test-handle', {
                title: tabTitle,
                content: '<div class="control-container  line-wrap">' +
                            '<label for="Rescale-input" class="control-label">自定义词条组:</label>' +
                            '<textarea id="tagGroupInput' + tabId + '" placeholder="Enter custom terms, one per line" class="layui-textarea" style="min-height: 100px;"></textarea>' +
                            '<button class="layui-btn layui-btn-primary layui-btn-sm" onclick="generateTagGroupTable(' + tabId + ')">生成词条组表格</button>' +
                          '</div>' +
                          '<hr class="ws-space-16">' +
                          '<div>' +
                            '<table id="tagGroupTable' + tabId + '" lay-filter="tagGroupTable"></table>' +
                          '</div>',
                id: tabId
            });
            element.tabChange('test-handle', tabId); // 切换到新选项卡
            layer.close(index);
        });
    });

    // 添加角色选项卡的函数
    $('#addPlayerBtn').on('click', function() {
        layer.prompt({title: '输入选项卡名称', formType: 0}, function(value, index){
            var tabId = new Date().getTime(); // 使用时间戳作为唯一ID
            var tabTitle = '角色-' + value;
            playerData[tabId] = []; // 初始化角色数据

            element.tabAdd('test-handle', {
                title: tabTitle,
                content: 
                        
                        '<div class="control-container line-wrap">' +
                            '<div class="layui-form">' +
                                '<input type="checkbox" name="insertBeforeIllustrator' + tabId + '" title="放于最前">' +
                            '</div>' +
                            '<label for="Rescale-input" class="control-label">自定义角色词条:</label>' +
                            '<textarea id="playerInput' + tabId + '" placeholder="Enter custom terms, separated by commas" class="layui-textarea" style="min-height: 30px;"></textarea>' +
                            '<button class="layui-btn layui-btn-primary layui-btn-sm" onclick="generatePlayerTable(' + tabId + ')">生成角色表格</button>' +
                        '</div>' +
                        '<hr class="ws-space-16">' +
                        '<div>' +
                            '<table id="playerTable' + tabId + '" lay-filter="playerTable"></table>' +
                        '</div>',
                id: tabId
            });
            form.render(); // 渲染表单
            element.tabChange('test-handle', tabId); // 切换到新选项卡
            layer.close(index);
        });
    });

    // 生成角色表格的函数
    window.generatePlayerTable = function(tabId) {
        var playerInput = $('#playerInput' + tabId).val();
        var entries = playerInput.split(',').filter(entry => entry.trim() !== '');
        var playerTableData = [];

        entries.forEach(function(entry, index) {
            playerTableData.push({
                id: index + 1,
                entry: entry.trim(),
                disabled: false
            });
        });

        table.render({
            elem: '#playerTable' + tabId,
            cols: [[
                {field: 'id', title: 'ID', width: 80, sort: true},
                {field: 'entry', title: '词条', width: 460},
                {field: 'delete', title: '操作', width: 80, templet: '#deleteBtnTpl'}
            ]],
            data: playerTableData,
            page: true
        });

        // 保存当前表格数据到角色字典中，以便在抽取时使用
        playerData[tabId] = playerTableData;
    };

    // 导出角色配置按钮的点击事件
    $('#exportPlayerBtn').on('click', function() {
        var dataToExport = [];

        $('.layui-tab-title li').each(function() {
            var tabId = $(this).attr('lay-id');
            var tabName = $(this).text();

            if (playerData[tabId]) {
                dataToExport.push({
                    tabId: tabId,
                    tabName: tabName,
                    entries: playerData[tabId]
                });
            }
        });

        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport));
        var downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "playerConfig.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });

    // 导入角色配置按钮的点击事件
    $('#importPlayerBtn').on('click', function() {
        $('#importPlayerFile').click();
    });

    $('#RemoveDefaultTab').on('click', function() {
        removeSelectedTabsExceptIllustrator(layui.element, layui.form, customEntryData, tagGroupData, playerData);
    });


    $('#importPlayerFile').on('change', function(event) {
        var file = event.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var content = e.target.result;
                var importedData = JSON.parse(content);

                importedData.forEach(function(playerDataItem) {
                    // 重新创建角色选项卡
                    var tabId = playerDataItem.tabId;
                    var tabTitle = playerDataItem.tabName;
                    playerData[tabId] = playerDataItem.entries;

                    element.tabAdd('test-handle', {
                        title: tabTitle,
                        content: '<div class="control-container line-wrap">' +
                            '<div class="layui-form">' +
                            '<input type="checkbox" name="insertBeforeIllustrator' + tabId + '" title="放于最前">' +
                            '</div>' +
                            '<label for="Rescale-input" class="control-label">自定义角色词条:</label>' +
                            '<textarea id="playerInput' + tabId + '" placeholder="Enter custom terms, separated by commas" class="layui-textarea" style="min-height: 30px;"></textarea>' +
                            '<button class="layui-btn layui-btn-primary layui-btn-sm" onclick="generatePlayerTable(' + tabId + ')">生成角色表格</button>' +
                            '</div>' +
                            '<hr class="ws-space-16">' +
                            '<div>' +
                            '<table id="playerTable' + tabId + '" lay-filter="playerTable"></table>' +
                            '</div>',
                        id: tabId
                    });

                    table.render({
                        elem: '#playerTable' + tabId,
                        cols: [[
                            { field: 'id', title: 'ID', width: 80, sort: true },
                            { field: 'entry', title: '词条', width: 460 },
                            { field: 'delete', title: '操作', width: 80, templet: '#deleteBtnTpl' }
                        ]],
                        data: playerDataItem.entries,
                        page: true
                    });
                    form.render(); // 渲染表单
                    // 更新抽取个数输入框的最大值
                    $('#entryCount' + tabId).attr('max', playerDataItem.entries.length);
                });

                layer.msg('导入成功');
            };
            reader.readAsText(file);
        }
        $('#importPlayerFile').val(''); // 重置文件输入框
    });

    // 生成词条组表格的函数
    window.generateTagGroupTable = function(tabId) {
        var tagGroupInput = $('#tagGroupInput' + tabId).val();
        var entries = tagGroupInput.split('\n').filter(entry => entry.trim() !== '');
        var tagGroupTableData = [];

        entries.forEach(function(entry, index) {
            tagGroupTableData.push({
                id: index + 1,
                entry: entry.trim(),
                disabled: false
            });
        });

        table.render({
            elem: '#tagGroupTable' + tabId,
            cols: [[
                {field: 'id', title: 'ID', width: 80, sort: true},
                {field: 'entry', title: '词条', width: 460},
                {field: 'delete', title: '操作', width: 80, templet: '#deleteBtnTpl'}
            ]],
            data: tagGroupTableData,
            page: true
        });

        // 保存当前表格数据到词条组字典中，以便在抽取时使用
        tagGroupData[tabId] = tagGroupTableData;
    };

    // Listen for delete button click for tag group tables
    table.on('tool(tagGroupTable)', function(obj){
        var data = obj.data;
        if (obj.event === 'delete') {
            obj.del(); // 删除对应行（tr）的DOM结构，并更新缓存
            var tabId = obj.config.id.replace('tagGroupTable', '');
            tagGroupData[tabId] = tagGroupData[tabId].filter(item => item.id !== data.id);
        }
    });

    // 获取一组词条组的函数
    $('#getTerms').on('click', function() {
        var tagGroupIds = Object.keys(tagGroupData);
        if (tagGroupIds.length === 0) {
            layer.msg('没有可用的词条组');
            return;
        }
    
        var randomTagGroupId = tagGroupIds[Math.floor(Math.random() * tagGroupIds.length)];
        var randomTagGroup = tagGroupData[randomTagGroupId];
    
        // 获取当前词条组的索引
        if (typeof randomTagGroup.currentIndex === 'undefined') {
            randomTagGroup.currentIndex = 0;
        }
    
        var randomTagGroupEntry = randomTagGroup[randomTagGroup.currentIndex].entry;
    
        // 更新当前词条组的索引
        randomTagGroup.currentIndex = (randomTagGroup.currentIndex + 1) % randomTagGroup.length;
    
        var illustratorCount = parseInt($('#illustratorCount').val());
        if (isNaN(illustratorCount)) {
            illustratorCount = 5; // 设置默认值为5
        }
    
        if (illustratorCount > illustratorsData.length) {
            layer.msg('抽取数量不能超过画师词条的数量');
            return;
        }
        if (illustratorCount < illustratorminCount) {
            layer.msg('抽取数量不能小于最小抽取数量');
            return;
        }
        var Random_range = $("input[name='Random_range']").is(':checked');
        if (Random_range) {
            var illustratorminCount = parseInt($('#illustratorMinCount').val());
            if (isNaN(illustratorminCount)) {
                illustratorminCount = 1; // 设置默认值为1
            }
            // 随机一个新的值更新给illustratorCount，范围在illustratorminCount到illustratorCount之间
            illustratorCount = Math.floor(Math.random() * (illustratorCount - illustratorminCount + 1)) + illustratorminCount;
            console.log(illustratorCount)
        }
    
        var randomEntries = [];
        var entryCount = parseInt($('#entryCount').val());
        if (entryCount > 0) {
            if (entryCount > entryTableData.length) {
                layer.msg('抽取数量不能超过自定义词条的数量');
                return;
            }
            randomEntries = getRandomItems(entryTableData, entryCount, 'entry').map(item => item.entry);
            console.log("Random Entries", randomEntries);
            console.log("entryTableData", entryTableData);
        }
    
        for (var tabId in customEntryData) {
            var customEntryCount = parseInt($('#entryCount' + tabId).val());
            if (customEntryCount > 0) {
                var customEntries = customEntryData[tabId];
                if (customEntryCount > customEntries.length) {
                    layer.msg('抽取数量不能超过自定义词条的数量');
                    return;
                }
                var randomCustomEntries = getRandomItems(customEntries, customEntryCount, 'entry').map(item => item.entry);
                randomEntries = randomEntries.concat(randomCustomEntries);
                console.log("Random Custom Entries", randomCustomEntries);
            }
        }
    
        var randomIllustrators = getRandomItems(illustratorsData, illustratorCount, 'english').map(item => item.entry);
    
        // 获取一个角色词条
        var playerEntries = [];
        var insertBeforeIllustrator = false;
        for (var tabId in playerData) {
            var playerTabEntries = playerData[tabId].map(item => item.entry);
            if (playerTabEntries.length > 0) {
                var randomPlayerEntry = playerTabEntries[Math.floor(Math.random() * playerTabEntries.length)];
                playerEntries.push(randomPlayerEntry);
            }
            insertBeforeIllustrator = $("input[name='insertBeforeIllustrator" + tabId + "']").is(':checked');
        }
    
        // 监控复选框状态
        var artistPositionChecked = $("input[name='Artist_position']").is(':checked');
    
        var resultEntries = [];
        if (artistPositionChecked) {
            if (insertBeforeIllustrator) {
                resultEntries = playerEntries.concat(randomIllustrators).concat(randomEntries).concat([randomTagGroupEntry]);
                console.log("Result Entries1", resultEntries);
            } else {
                resultEntries = randomIllustrators.concat(playerEntries).concat(randomEntries).concat([randomTagGroupEntry]);
                console.log("Result Entries2", resultEntries);
            }
        } else {
            if (insertBeforeIllustrator) {
                resultEntries = playerEntries.concat(randomEntries).concat(randomIllustrators).concat([randomTagGroupEntry]);
                console.log("Result Entries3", resultEntries);
            } else {
                resultEntries = [randomTagGroupEntry].concat(playerEntries).concat(randomEntries).concat(randomIllustrators);
                console.log("Result Entries4", resultEntries);
            }
        }
    
        $('#tagarea').val(resultEntries.join(', '));
    });
    

    $('#randomSelectBtn').on('click', function() {
        var entryCount = parseInt($('#entryCount').val());
        var illustratorCount = parseInt($('#illustratorCount').val());
        if (isNaN(illustratorCount)) {
            illustratorCount = 5; // 设置默认值为5
        }
    
        if (illustratorCount > illustratorsData.length) {
            layer.msg('抽取数量不能超过画师词条的数量');
            return;
        }
    
        var Random_range = $("input[name='Random_range']").is(':checked');
        if (Random_range) {
            var illustratorminCount = parseInt($('#illustratorMinCount').val());
            if (isNaN(illustratorminCount)) {
                illustratorminCount = 1; // 设置默认值为1
            }
            // 随机一个新的值更新给illustratorCount，范围在illustratorminCount到illustratorCount之间
            illustratorCount = Math.floor(Math.random() * (illustratorCount - illustratorminCount + 1)) + illustratorminCount;
            console.log(illustratorCount);
        }
    
        var randomEntries = [];
        if (entryCount > 0) {
            if (entryCount > entryTableData.length) {
                layer.msg('抽取数量不能超过自定义词条的数量');
                return;
            }
            randomEntries = getRandomItems(entryTableData, entryCount, 'entry');
        }
    
        for (var tabId in customEntryData) {
            var customEntryCount = parseInt($('#entryCount' + tabId).val());
            if (customEntryCount > 0) {
                var customEntries = customEntryData[tabId];
                if (customEntryCount > customEntries.length) {
                    layer.msg('抽取数量不能超过自定义词条的数量');
                    return;
                }
                var randomCustomEntries = getRandomItems(customEntries, customEntryCount, 'entry');
                randomEntries = randomEntries.concat(randomCustomEntries);
            }
        }
    
        var randomIllustrators = getRandomItems(illustratorsData, illustratorCount, 'english');
    
        // 获取一个角色词条
        var playerEntries = [];
        var insertBeforeIllustrator = false;
        var foundInsertBeforeIllustrator = false; // 标记是否找到插入前复选框
    
        for (var tabId in playerData) {
            var playerTabEntries = playerData[tabId].map(item => item.entry);
            if (playerTabEntries.length > 0) {
                var randomPlayerEntry = playerTabEntries[Math.floor(Math.random() * playerTabEntries.length)];
                playerEntries.push({entry: randomPlayerEntry}); // 确保角色词条也作为对象插入
    
                if (!foundInsertBeforeIllustrator) {
                    insertBeforeIllustrator = $("input[name='insertBeforeIllustrator" + tabId + "']").is(':checked');
                    foundInsertBeforeIllustrator = true; // 只需要找到一个即可
                }
            }
        }
    
        // 监控复选框状态
        var artistPositionChecked = $("input[name='Artist_position']").is(':checked');
        var randomSortChecked = $("input[name='Random_sort']").is(':checked');
    
        // 随机排序除画师外的词条
        if (randomSortChecked) {
            randomEntries = shuffleArray(randomEntries);
        }
    
        var resultEntries = [];
        if (artistPositionChecked) {
            if (insertBeforeIllustrator) {
                resultEntries = playerEntries.concat(randomIllustrators).concat(randomEntries);
            } else {
                resultEntries = randomIllustrators.concat(playerEntries).concat(randomEntries);
            }
        } else {
            if (insertBeforeIllustrator) {
                resultEntries = playerEntries.concat(randomEntries).concat(randomIllustrators);
            } else {
                resultEntries = randomEntries.concat(playerEntries).concat(randomIllustrators);
            }
        }
    
        console.log("Final Result Entries", resultEntries);
    
        $('#tagarea').val(resultEntries.map(item => item.entry).join(', '));
    });
    


    // Listen for tab delete event
    element.on('tabDelete(test-handle)', function(data){
        var tabId = $(this).parent().attr('lay-id');
        delete customEntryData[tabId];
        delete tagGroupData[tabId];
        delete playerData[tabId];
    });
});

function removeSelectedTabsExceptIllustrator(element, form, customEntryData, tagGroupData, playerData) {
    var tabs = $('.layui-tab-title li');
    var tabOptions = '';

    // 创建复选框选项，默认不勾选
    tabs.each(function() {
        var tabId = $(this).attr('lay-id');
        var tabTitle = $(this).text();
        if (tabTitle !== '画师') {
            tabOptions += '<input type="checkbox" name="tabOption" value="' + tabId + '" title="' + tabTitle + '">';
        }
    });

    // 创建弹窗
    layer.open({
        type: 1,
        title: '选择要保留的选项卡',
        content: '<form class="layui-form" id="tabSelectionForm">' + tabOptions + '</form>',
        btn: ['确认', '取消'],
        yes: function(index, layero) {
            var selectedTabs = [];
            $('#tabSelectionForm input[name="tabOption"]:checked').each(function() {
                selectedTabs.push($(this).val());
            });

            // 删除未勾选的选项卡
            tabs.each(function() {
                var tabId = $(this).attr('lay-id');
                var tabTitle = $(this).text();
                if (tabTitle !== '画师' && !selectedTabs.includes(tabId)) {
                    element.tabDelete('test-handle', tabId);
                    delete customEntryData[tabId];
                    delete tagGroupData[tabId];
                    delete playerData[tabId];
                }
            });

            layer.close(index);
        },
        success: function(layero, index) {
            form.render(); // 渲染表单
        }
    });
}
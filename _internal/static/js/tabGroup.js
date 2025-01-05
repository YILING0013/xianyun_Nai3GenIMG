(function() {
    'use strict';

    let tabGroupCount = 0;

    // ========= 加载时先尝试恢复 localStorage 中的数据 =========
    document.addEventListener('DOMContentLoaded', () => {
      loadFromLocalStorage();
    });

    // ========== updateGlobalData并把数据存到localStorage ==========
    function updateGlobalData() {
      const tabGroups = document.querySelectorAll('.tab-group');
      characterPrompts = [];
      v4_prompt_char_captions = [];
      v4_negative_prompt_char_captions = [];

      tabGroups.forEach(tabGroup => {
        const groupId = parseInt(tabGroup.dataset.groupId, 10);
        const prompt = tabGroup.querySelector(`#input1_${groupId}`)?.value || "";
        const uc = tabGroup.querySelector(`#input2_${groupId}`)?.value || "";
        const position = tabGroup.querySelector(`#selectedPosition_${groupId}`)?.textContent || "None";

        const center = (() => {
          const rowMap = { 1: 0.1, 2: 0.3, 3: 0.5, 4: 0.7, 5: 0.9 };
          const colMap = { A: 0.1, B: 0.3, C: 0.5, D: 0.7, E: 0.9 };
          const row = position?.[1];
          const col = position?.[0];
          return { x: colMap[col] || 0, y: rowMap[row] || 0 };
        })();

        characterPrompts.push({ prompt, uc, center });

        v4_prompt_char_captions.push({
          char_caption: prompt,
          centers: [center]
        });

        v4_negative_prompt_char_captions.push({
          char_caption: uc,
          centers: [center]
        });
      });
      // >>>>>> 调用存储函数 <<<<<<
      saveToLocalStorage();
    }

    // ========== 保存到 localStorage ==========
    function saveToLocalStorage() {
      // 把页面上的所有 tabGroup 信息收集起来
      const dataToSave = [];
      const tabGroups = document.querySelectorAll('.tab-group');
      tabGroups.forEach(tabGroup => {
        const groupId = parseInt(tabGroup.dataset.groupId, 10);
        const prompt = tabGroup.querySelector(`#input1_${groupId}`)?.value || "";
        const uc = tabGroup.querySelector(`#input2_${groupId}`)?.value || "";
        const position = tabGroup.querySelector(`#selectedPosition_${groupId}`)?.textContent || "None";

        dataToSave.push({
          groupId,
          prompt,
          uc,
          position
        });
      });

      // 把数据转成 JSON 字符串，保存在 localStorage 中
      try {
        localStorage.setItem('myTabGroups', JSON.stringify(dataToSave));
      } catch (e) {
        console.error('保存到 localStorage 失败:', e);
      }
    }

    // ========== 从 localStorage 加载并恢复界面 ==========
    function loadFromLocalStorage() {
      const stored = localStorage.getItem('myTabGroups');
      if (!stored) {
        return;
      }

      let parsedData = [];
      try {
        parsedData = JSON.parse(stored);
      } catch (e) {
        console.error('解析 localStorage 数据失败:', e);
        return;
      }
      if (!Array.isArray(parsedData)) {
        console.error('解析后的数据不是数组。');
        return;
      }

      // 清除当前页面上的所有 tabGroup，以避免重复
      clearAllTabGroups();

      // 找到最大的 groupId，初始化全局计数器
      let maxGroupId = 0;
      parsedData.forEach(item => {
        if (item.groupId > maxGroupId) {
          maxGroupId = item.groupId;
        }
      });
      tabGroupCount = maxGroupId; // 先把计数器设置到历史最大

      // 根据存储的数据重新创建 tabGroup
      parsedData.forEach(item => {
        createTabGroupByData(item.groupId, item.prompt, item.uc, item.position);
      });
      updateGlobalData();
    }

    // ========== 清除所有当前的 tabGroup ==========
    function clearAllTabGroups() {
      const tabContainer = document.getElementById('tabContainer');
      while (tabContainer.firstChild) {
        tabContainer.removeChild(tabContainer.firstChild);
      }
    }

    // ========== 根据存储的数据创建一个tabGroup并填充内容 ==========
    function createTabGroupByData(groupId, promptValue, ucValue, positionValue) {
      // 创建容器
      const tabGroup = document.createElement('div');
      tabGroup.className = 'tab-group';
      tabGroup.dataset.groupId = groupId;

      // 组装 innerHTML
      tabGroup.innerHTML = `
        <div class="collapsed" onclick="toggleCollapse(event, ${groupId})">
            <span id="collapsedContent_${groupId}"></span>
            <div>
                <button data-direction="up" onclick="moveTabGroup(event, ${groupId}, 'up')" class="layui-btn layui-btn-xs layui-btn-primary move-tab-group-btn" >
                    <i class="layui-icon layui-icon-up"></i>
                </button>
                <button data-direction="down" onclick="moveTabGroup(event, ${groupId}, 'down')" class="layui-btn layui-btn-xs layui-btn-primary move-tab-group-btn">
                    <i class="layui-icon layui-icon-down"></i>
                </button>
                <button onclick="deleteTabGroup(event, ${groupId})" class="delete-tab-group-btn layui-btn layui-btn-xs layui-btn-danger">
                    <i class="layui-icon layui-icon-delete"></i>
                </button>
            </div>
        </div>
        <div class="tabs">
            <div style="display: flex; gap: 5px;">
                <div class="tab active" data-tab="1" onclick="switchTab(event, ${groupId})">Prompt</div>
                <div class="tab" data-tab="2" onclick="switchTab(event, ${groupId})">UContent</div>
                <div class="tab" data-tab="3" onclick="switchTab(event, ${groupId})">Pos</div>
            </div>
        </div>
        <div class="tab-content active" data-tab="1">
            <label for="input1_${groupId}">角色描述词:</label>
            <textarea id="input1_${groupId}" placeholder="Prompt" class="layui-textarea" oninput="updateCollapsedContent(${groupId}); updateGlobalData()">${promptValue || ''}</textarea>
        </div>
        <div class="tab-content" data-tab="2">
            <label for="input2_${groupId}">避免的内容:</label>
            <textarea id="input2_${groupId}" placeholder="Undesired Content" class="layui-textarea" oninput="updateGlobalData()">${ucValue || ''}</textarea>
        </div>
        <div class="tab-content" data-tab="3">
            <div class="grid">
                ${
                  ['1', '2', '3', '4', '5'].map(row => 
                    ['A', 'B', 'C', 'D', 'E'].map(col => 
                      `<button data-position="${col}${row}" onclick="selectPosition(event, ${groupId})" ${positionValue === `${col}${row}` ? 'class="selected"' : ''}>${col}${row}</button>`
                    ).join('')
                  ).join('')
                }
            </div>
            <p>选择的位置: <span id="selectedPosition_${groupId}">${positionValue !== "None" ? positionValue : 'None'}</span></p>
        </div>
      `;

      document.getElementById('tabContainer').appendChild(tabGroup);

      // 设置折叠栏简要内容
      const collapsedContent = tabGroup.querySelector(`#collapsedContent_${groupId}`);
      collapsedContent.textContent = promptValue?.substring(0, 8) || "";

      // 如果有 positionValue，则选中对应按钮并显示
      if (positionValue && positionValue !== "None") {
        const btn = tabGroup.querySelector(`button[data-position="${positionValue}"]`);
        if (btn) {
          btn.classList.add('selected');
          const selectedPositionDisplay = tabGroup.querySelector(`#selectedPosition_${groupId}`);
          selectedPositionDisplay.textContent = positionValue;
        }
      }
    }

    // ========== 新增选项卡的逻辑 ==========
    document.getElementById('addTabGroup').addEventListener('click', () => {
      if (tabGroupCount >= 6) {
        alert('你只能创建最多 6 个选项卡组。');
        return;
      }
      tabGroupCount++;
      createTabGroupByData(tabGroupCount, "", "", "None"); 
      updateGlobalData();
    });

    // ========== 手动加载选项卡的逻辑 ==========
    document.getElementById('loadTabGroups').addEventListener('click', () => {
      loadFromLocalStorage();
    });

    // ========== 辅助函数 ==========
    window.toggleCollapse = function(event, groupId) {
      // 检查是否点击了按钮或按钮的子元素
      if (event.target.closest('button')) return;
      
      const tabGroup = event.currentTarget.parentElement;
      const isCollapsed = tabGroup.classList.toggle('collapsed');
      const tabs = tabGroup.querySelectorAll('.tabs, .tab-content');

      tabs.forEach(tab => {
        tab.style.display = isCollapsed ? 'none' : 'block';
      });

      const collapsedContainer = tabGroup.querySelector('.collapsed');
      if (isCollapsed) {
        // 在折叠时设置宽度为100%
        collapsedContainer.style.width = '100%';
      } else {
        // 在展开时移除宽度样式
        collapsedContainer.style.width = '';
        const activeTab = tabGroup.querySelector('.tab.active');
        const tabContent = tabGroup.querySelector(`.tab-content[data-tab="${activeTab.dataset.tab}"]`);
        tabGroup.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
          content.style.display = 'none';
        });
        tabContent.classList.add('active');
        tabContent.style.display = 'block';
      }
      updateGlobalData();
    }

    window.switchTab = function(event, groupId) {
      const tabGroup = document.querySelector(`.tab-group[data-group-id="${groupId}"]`);
      if (!tabGroup) {
        console.error(`未找到 groupId 为 ${groupId} 的 tab-group`);
        return;
      }
      const tabs = tabGroup.querySelectorAll('.tab');
      const contents = tabGroup.querySelectorAll('.tab-content');
      tabs.forEach(tab => tab.classList.remove('active'));
      contents.forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
      });
      const clickedTab = event.target;
      clickedTab.classList.add('active');
      const tabContent = tabGroup.querySelector(`.tab-content[data-tab="${clickedTab.dataset.tab}"]`);
      tabContent.classList.add('active');
      tabContent.style.display = 'block';
      updateGlobalData();
    }

    window.moveTabGroup = function(event, groupId, direction) {
      const tabGroup = document.querySelector(`.tab-group[data-group-id="${groupId}"]`);
      const container = document.getElementById('tabContainer');
      if (!tabGroup) {
        console.error(`未找到 groupId 为 ${groupId} 的 tab-group`);
        return;
      }
      if (direction === 'up' && tabGroup.previousElementSibling) {
        container.insertBefore(tabGroup, tabGroup.previousElementSibling);
      } else if (direction === 'down' && tabGroup.nextElementSibling) {
        container.insertBefore(tabGroup.nextElementSibling, tabGroup);
      }
      updateGlobalData();
    }

    window.deleteTabGroup = function(event, groupId) {
      const tabGroup = document.querySelector(`.tab-group[data-group-id="${groupId}"]`);
      if (!tabGroup) {
        console.error(`未找到 groupId 为 ${groupId} 的 tab-group`);
        return;
      }
      tabGroup.remove();
      updateGlobalData();
    }

    window.updateCollapsedContent = function(groupId) {
      const inputField = document.querySelector(`#input1_${groupId}`)?.value || "";
      const collapsedContent = document.querySelector(`#collapsedContent_${groupId}`);
      collapsedContent.textContent = `${inputField.substring(0, 8)}`;
      updateGlobalData();
    }

    window.selectPosition = function(event, groupId) {
      const buttons = document.querySelectorAll(`.tab-group[data-group-id="${groupId}"] .grid button`);
      buttons.forEach(button => button.classList.remove('selected'));
      const button = event.target;
      button.classList.add('selected');
      const selectedPositionDisplay = document.querySelector(`#selectedPosition_${groupId}`);
      selectedPositionDisplay.textContent = button.dataset.position;
      updateGlobalData();
    }
})();

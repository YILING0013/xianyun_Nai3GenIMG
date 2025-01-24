## 关于本项目

2025.1.24: 程序新增了启动器，配置部分可用通过启动器配置和运行，支持配置公网访问(多人共享)

【文档部分内容过时，请以实际页面为准】本项目是基于python-Flask为后端编写的web应用程序，实现了基于NovelAI的图像生成。当前可以实现的操作有：

[文生图](#文生图)：基于文本的AI图像生成;

[以图生图](#以图生图功能):

- [x] [以图生图](#以图生图局部重绘)：基于图像和文本的AI图像生成
- [x] [局部重绘](#以图生图局部重绘)：基于图像蒙版的AI图像生成
- [x] [区域裁剪重绘](#截取重绘)：裁剪出一块区域，在此区域基础上进行重绘，达到更好的细节修复
- [x] [图像边缘扩展](#图像扩展)：基于蒙版功能，将图像边缘扩展并进行蒙版重绘

[文本翻译](#文本翻译)：基于Chatgpt的文本翻译;

[Vibe Transfer多图支持](#VibeTransfer多图支持)：与官网相同的Vibe功能;

[词条笔记本](#词条笔记本)：保存词条为笔记，方便下次使用;

[随机词条功能](#随机词条功能)：
- [x] [随机画师](#随机词条功能)
- [x] [随机词条](#随机词条功能)
- [x] [随机词条组轮询](#随机词条功能)
- [x] [随机顺序](#随机词条功能)
- [x] [自定义随机抽取](#随机词条功能)

自动挂机：最高可连续绘制500次的自动挂机功能;

自动下载：可以自动将图像保存到主目录;

[一键图集转Excel](#一键图集转excel)：支持一键将AI图像提取元数据并生成为精美的Excel文档;

[图像元数据覆写](#图像元数据覆写)：将图像的数据进行更改，支持批量修改;

## 功能介绍

### 启动

解压压缩包得到如下文件：\
<img src="./images/media/image1.png" width="auto" height="auto" />

运行启动器.exe：

<img src="./images/media/image2.png" width="auto" height="auto" />

启动如图所示的控制台程序，按住CTRL点击地址或浏览器访问<http://127.0.0.1:5000>进入页面：\
<img src="./images/media/image3.png" width="auto" height="auto" />

### 登录

访问<https://novelai.net>

登录后进入页面

<img src="./images/media/image4.png" width="auto" height="auto" />

点击左上角""，进入设置，找到Account页面

<img src="./images/media/image5.png" width="auto" height="auto" />

点击Get Persistent API Token并复制，token内容如：pst-xxxxxxxxxxxxxxxx

回到登录页，输入Bearer pst-xxxxxxxxxxxxxxxx并登录

### 文生图

文生图是基于文本进行的图像生成。在文本框输入内容后，适当调整参数即可进行生成

<img src="./images/media/image6.png" width="auto" height="auto" />

生成后的图像会在图像输出区域展示

<img src="./images/media/image7.png" width="auto" height="auto" />

最下方会有一个图像预览区域

<img src="./images/media/image8.png" width="auto" height="auto" />

历史生成的图像都会在此显示，可以点击seed将种子发送到seed文本框，也可以点击删除键删除该图像（如果你没有开启自动下载的话，所有图像会在页面关闭后永久删除）

在生成按钮旁可以开启自动下载和连续绘制功能

<img src="./images/media/image9.png" width="auto" height="auto" />

开启自动下载后图像将被保存到AI_images目录下，或者你也可以点击图像，选择下载

#### 其他

你可以发现，在文本框输入内容后，会显示推荐词条

<img src="./images/media/image10.png" width="auto" height="auto" />

点击推荐内容即可将其填入文本区域，替换最近的一次输入

在文本区域，右键会出现菜单

<img src="./images/media/image11.png" width="auto" height="auto" />

在菜单中，你可以对选中文本进行加权，降权和注释操作，其中注释操作会将选中的内容注释，并在请求中忽视被注释文本，被注释的文本两侧被/\*\*/包裹

### 以图生图功能

以图生图以及其他图像处理，需要展开图像上传功能区

<img src="./images/media/image12.png" width="auto" height="auto" />

展开后会有三个上传组件，分别对应以**图生图&局部重绘、截取重绘、图像扩展**三大功能

<img src="./images/media/image13.png" width="auto" height="auto" />

#### 以图生图&局部重绘

上传图像到该功能区后，页面如下

<img src="./images/media/image14.png" width="auto" height="auto" />

如果你图像是AI生成并且包含元数据，可以进行参数的更新，之后图像将渲染到功能区

<img src="./images/media/image15.png" width="auto" height="auto" />

按照推荐的分辨率，将参数调整到一致或者等比放大的分辨率。例如该处为1：1图像，你可以按照该分辨率，也可以等比设置一个1280\*1280分辨率的图像，这不影响图像生成，但不同比例的分辨率会导致图像形变。

此外注意：

1. 设置的参数分辨率不要超过3145728(2048X1536的值)，这是官网允许的最大分辨率，超过会导致生成失败
2. 不要将账号的点数消耗为负数，这会导致再也无法进行图像生成除非你进行续费（过大的分辨率【大于1216X832】、高于28步数会导致点数消耗，在此基础上调整其余参数会导致更高的点数消耗，例如smea）

当你导入图像后，会观察到上方的一排组件：

名称  | 功能
------------- | -------------
笔刷大小 | 调整绘制蒙版的笔刷粗细
导出蒙版 | 绘制好蒙版后进行导出，导出后绘图将变为局部重绘
生成背景蒙版 | 自动抠图去除图像背景，并生成背景蒙版（不保证长时间有用）
撤销 | 撤销一步绘制操作
重做 | 还原一步被撤销的操作
清空 | 清空所有绘制

**如果不进行蒙版导出，即为默认的图生图，如果导出了蒙版，则自动进行局部重绘**

#### 截取重绘

上传图像到第二功能区，进入如下页面

<img src="./images/media/image16.png" width="auto" height="auto" />

点击导出图像，即可将款选区域截取 **（在区域双击可切换移动/框选操作）**

<img src="./images/media/image17.png" width="auto" height="auto" />

导出后你可以进行如图生图或局部重绘的操作，并进行绘制

**局部重绘不要涂抹到边缘，会影响图像的拼接**

<img src="./images/media/image18.png" width="auto" height="auto" />

进行图像生成后，寻找到一张合适的图像 **【注：开始生成后不要移动选择框，会导致图像错误贴合】**

<img src="./images/media/image19.png" width="auto" height="auto" />

点击 **【使用生成的图像填补】** 按钮，即可得到：

<img src="./images/media/image20.png" width="auto" height="auto" />


<img src="./images/media/image21.png" width="auto" height="auto" />

> 对比图.

***注：注意保存图像，该操作图像无法自动保存，也不会添加在预览区***

#### 图像扩展

图像上传到第三区后，页面如下：\
<img src="./images/media/image22.png" width="auto" height="auto" />

在图像边缘进行点击，会扩展画布，例如：\
<img src="./images/media/image23.png" width="auto" height="auto" />

点击后的白边即为扩展的图像边缘，每次点击扩展64分辨率，可以多次点击，但不要超过5次；

点击重置画布可以清空扩展，点击更新画布状态会**锁定当前状态为初始**；

扩展后**导出蒙版**，即可进行图像生成，生成后**点击图像填补即可使用生成的图像将画布补充完整（此处分辨率自动设置，无需调整）**：\
<img src="./images/media/image24.png" width="auto" height="auto" />

蒙版扩展像素是调整蒙版边缘与图像的交汇情况，越高的蒙版扩展，重绘的影响范围就越大

<img src="./images/media/image25.png" width="auto" height="auto" />

你可以多次对图像进行扩图，例如再次选择底部进行扩展，也可以选择侧面进行扩展，但需要注意：**当不断扩展一边导致该边对应的侧边长度超过2048分辨率后，侧边将无法进行扩展，此时只能扩展短边，任何超过2048分辨率的边不支持进行扩展，只能扩展小于2048分辨率的边。**

最终效果图：

<img src="./images/media/image26.png" width="auto" height="auto" />

### 文本翻译

在config.yaml中配置好翻译所需的api

<img src="./images/media/image27.png" width="auto" height="auto" />

之后在页面：

<img src="./images/media/image28.png" width="auto" height="auto" />

文本框1输入需要翻译的内容，点击翻译后将会在文本框2显示翻译结果，会自动识别语言，输入中文翻译为英文，其他语种自动翻译为中文

### VibeTransfer多图支持

在正面提示词组件处

<img src="./images/media/image29.png" width="auto" height="auto" />

将图像上传或者拖动到此处，即可添加为Vibe：\
<img src="./images/media/image30.png" width="auto" height="auto" />

点击上方复选框进行启用，自定义好参数即可

### 词条笔记本

<img src="./images/media/image31.png" width="auto" height="auto" />

点击上传词条，将词条上传到本地json文件（本地端，在线版保存在云端），而后点击词条笔记本即可查看：\
<img src="./images/media/image32.png" width="auto" height="auto" />

### 随机词条功能

点击随机Tag，打开随机词条页面：\
<img src="./images/media/image33.png" width="auto" height="auto" />

其中具有预设好的内置类别：\
<img src="./images/media/image34.png" width="auto" height="auto" />

你可以打开<img src="./images/media/image35.png" width="auto" height="auto" />进行默认内容的配置，也可以将导出的配置文件放入其中（点击侧边蓝色按钮导出配置文件）

对类别内容点击X删除后这项类别将被暂时移除，不再进行抽取，也可点入类别，将抽取数量设置为0：\
<img src="./images/media/image36.png" width="auto" height="auto" />

点击添加自定义类别将会创建一个空类别：\
<img src="./images/media/image37.png" width="auto" height="auto" />

在自定义词条文本框输入逗号分隔的文本，点击生成词条表格即可创建抽取词条，设置抽取个数，本项类别即可加入抽取池；

点击添加轮询词组会创建一个词条组选项卡，以词条组-法典预设为例：\
<img src="./images/media/image38.png" width="auto" height="auto" />

在文本框中输入词条组，行分隔，点击创建即可创建轮询词组，每次将会按顺序取出一组，填入词条，如果你希望固定词组，则只添加一行词组，便只取出该词组。

> **页面默认只创建一个词条组选项卡，多个选项卡将不按预期作用，可以创建多个类别项**

点击添加随机角色可以创建一个角色选项卡，以内置为例：\
<img src="./images/media/image39.png" width="auto" height="auto" />

文本框输入角色，以逗号分隔，点击进行添加；

选中放于最前，可以将角色词条置于随机内容的第一位；

> **页面默认只创建一个角色选项卡，多个选项卡将不按预期作用**

点击获取随机类别，可在类别中进行抽取生成一组词条，并与画师和角色组合后（可选）添加到正面词条文本框中，

点击获取词条组，将会轮询取出一组预设词条组，与画师和角色组合（可选）后添加到文本框；

最下方是配置项复选框：\
<img src="./images/media/image40.png" width="auto" height="auto" />

功能  | 作用
------------- | -------------
点击画师置于前端 | 将会使画师放在最前列（如果存在角色，角色优先）
点击随机排序 | 将会随机打乱各个类别的排序组合
**每次请求自动随机词条** | **勾选后点击生成图像，将会自动随机类别项与画师组合**
**每次请求自动轮询词条组** | **勾选后每次请求不抽取随机类别，改为从词条组获取内容与画师组合；（二者无法同时选择）**
启用随机权重 | 给抽取类别和画师随机生成权重

#### 画师相关

<img src="./images/media/image41.png" width="auto" height="auto" />

自定义画师处，如果不勾选拆分，将会使输入内容原样生成为一个抽取项，此时设置：

<img src="./images/media/image42.png" width="auto" height="auto" />

自定义画师词条抽取数量为1，并且画师最大抽取个数为-1则固定画师串进行生成；

**配合轮询词条组，可以实现对画风固定的情况下，遍历自定义词条组内容，例如将法典内容添加为词条组，即可实现轮询遍历法典；**

### 一键图集转Excel

点击启动文件主目录的【转换AI图像目录为Excel.exe】程序：

<img src="./images/media/image43.png" width="auto" height="auto" />

此程序将自动获取AI_images目录下的所有AI图像，并获取其元数据，自动生成为一个Excel文档：\
<img src="./images/media/image44.png" width="auto" height="auto" />

### 图像元数据覆写

点击启动文件主目录的【图像覆写元数据_v2.1.exe】程序：

<img src="./images/media/image45.png" width="auto" height="auto" />

点击Open image加载一张图像，点击Open image folder加载文件夹，需要注意的是文件夹第一张图像必须是可读取元数据的：\
<img src="./images/media/image46.png" width="auto" height="auto" />
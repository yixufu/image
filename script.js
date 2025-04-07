// 等待 DOM 完全加载完毕后执行脚本
// (注意：由于我们在 HTML 中使用了 defer 属性，此处的 DOMContentLoaded 可能不是必需的，
// 但保留它是一种更安全的做法，以防 defer 加载顺序出现意外)
document.addEventListener('DOMContentLoaded', () => {

    // 获取 DOM 元素
    const imageUpload = document.getElementById('imageUpload');
    const originalImage = document.getElementById('originalImage');
    const originalPlaceholder = document.getElementById('originalPlaceholder');
    const resultArea = document.getElementById('resultArea');
    const messageBox = document.getElementById('messageBox');
    const messageIcon = document.getElementById('messageIcon');
    const messageText = document.getElementById('messageText');

    // 获取 Canvas 元素和下载链接
    const canvases = {
        16: document.getElementById('canvas16'),
        48: document.getElementById('canvas48'),
        128: document.getElementById('canvas128')
    };
    const downloadLinks = {
        16: document.getElementById('download16'),
        48: document.getElementById('download48'),
        128: document.getElementById('download128')
    };

    // 检查是否所有必要的 DOM 元素都已找到
    if (!imageUpload || !originalImage || !originalPlaceholder || !resultArea || !messageBox || !messageIcon || !messageText ||
        !canvases[16] || !canvases[48] || !canvases[128] ||
        !downloadLinks[16] || !downloadLinks[48] || !downloadLinks[128]) {
        console.error("错误：未能找到所有必需的 DOM 元素。请检查 HTML 结构和 ID 是否正确。");
        // 可以在这里向用户显示一个更友好的错误消息
        alert("页面初始化失败，部分元素丢失！");
        return; // 阻止后续代码执行
    }


    let messageTimeout; // 用于存储消息框的超时ID

    /**
     * 显示消息提示框
     * @param {string} text - 要显示的消息文本
     * @param {'success'|'error'} type - 消息类型 ('success' 或 'error')
     */
    function showMessage(text, type = 'success') {
        clearTimeout(messageTimeout); // 清除之前的超时
        messageText.textContent = text;
        // 重置类名，只保留基础类
        messageBox.className = 'message-box';
        messageIcon.className = 'lucide text-xl'; // 重置图标类名

        if (type === 'success') {
            messageBox.classList.add('success');
            messageIcon.classList.add('lucide-check'); // 添加成功图标类
        } else {
            messageBox.classList.add('error');
            messageIcon.classList.add('lucide-alert-circle'); // 添加错误图标类
        }

        messageBox.style.display = 'flex'; // 显示消息框

        // 3秒后自动隐藏
        messageTimeout = setTimeout(() => {
            messageBox.style.display = 'none';
        }, 3000);
    }

    /**
     * 重置用户界面到初始状态
     */
    function resetUI() {
        originalImage.style.display = 'none'; // 隐藏图片
        originalImage.src = '#'; // 清除旧的图片源，防止闪烁
        originalPlaceholder.style.display = 'flex'; // 显示占位符
        resultArea.classList.add('hidden'); // 隐藏结果区域
        imageUpload.value = ''; // 清空文件选择 Input 的值，允许再次选择相同文件

        // 清空画布和下载链接
        [16, 48, 128].forEach(size => {
            try {
                const canvas = canvases[size];
                // 检查 canvas 是否存在
                if (canvas && typeof canvas.getContext === 'function') {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                } else {
                    console.warn(`Canvas for size ${size}x${size} not found or invalid.`);
                }
                // 检查下载链接是否存在
                if (downloadLinks[size]) {
                    downloadLinks[size].href = '#'; // 重置下载链接 Href
                } else {
                     console.warn(`Download link for size ${size}x${size} not found.`);
                }
            } catch(error) {
                console.error(`Error resetting canvas/link for size ${size}:`, error);
            }
        });
        console.log("UI Reset.");
    }


    // 监听文件上传 input 的 change 事件
    imageUpload.addEventListener('change', (event) => {
        // 获取用户选择的第一个文件
        const file = event.target.files[0];

        // 检查是否选择了文件并且文件类型是图片
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader(); // 创建 FileReader 来读取文件

            // 文件读取成功完成时触发
            reader.onload = (e) => {
                const img = new Image(); // 创建一个新的 Image 对象

                // 当图片加载完成后触发
                img.onload = () => {
                    // 显示原图预览
                    originalImage.src = e.target.result; // 设置预览图片的 src 为读取到的 Data URL
                    originalImage.style.display = 'block'; // 显示预览图片
                    originalPlaceholder.style.display = 'none'; // 隐藏占位符
                    resultArea.classList.remove('hidden'); // 显示结果区域

                    // 遍历需要调整的尺寸
                    [16, 48, 128].forEach(size => {
                        try {
                            const canvas = canvases[size];
                            // 再次检查 canvas 是否有效
                            if (!canvas || typeof canvas.getContext !== 'function') {
                                throw new Error(`Canvas element for size ${size}x${size} is invalid.`);
                            }
                            const ctx = canvas.getContext('2d');

                            // 清除之前的绘制内容
                            ctx.clearRect(0, 0, canvas.width, canvas.height);

                            // 将加载的图片绘制到对应尺寸的 canvas 上
                            // drawImage 会自动缩放图片以适应 canvas 尺寸
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                            // 将 canvas 内容转换为 PNG 格式的 Data URL
                            const dataURL = canvas.toDataURL('image/png');

                             // 检查下载链接是否存在
                            if (!downloadLinks[size]) {
                                throw new Error(`Download link element for size ${size}x${size} not found.`);
                            }
                            // 更新对应尺寸的下载链接的 href 属性
                            downloadLinks[size].href = dataURL;

                            // --- 调试信息 ---
                            console.log(`Generated Data URL for ${size}x${size}:`, dataURL.substring(0, 100) + '...'); // 打印部分 Data URL
                            console.log(`Download link href for ${size}x${size} set to:`, downloadLinks[size].href.substring(0, 100) + '...');
                            // --- 结束调试信息 ---

                        } catch (error) {
                            // 如果在处理某个尺寸时出错，记录错误并显示给用户
                            console.error(`Error processing size ${size}x${size}:`, error);
                            showMessage(`处理 ${size}x${size} 尺寸时出错: ${error.message}`, 'error');
                            // 可以选择在这里停止处理后续尺寸或继续
                        }
                    });

                    // 检查处理过程中是否显示了错误消息
                    const isErrorDisplayed = messageBox.style.display === 'flex' && messageBox.classList.contains('error');
                    if (!isErrorDisplayed) {
                         // 如果没有错误，显示处理完成的消息
                         showMessage('图片处理完成!', 'success');
                    }
                };

                // 图片加载失败时触发
                img.onerror = () => {
                    showMessage('无法加载图片文件。请检查文件是否损坏或格式不受支持。', 'error');
                    resetUI(); // 重置界面
                };

                // 设置 Image 对象的 src，开始加载图片
                // e.target.result 包含 FileReader 读取到的 Data URL
                img.src = e.target.result;
            };

            // 文件读取失败时触发
            reader.onerror = () => {
                showMessage('读取文件时出错。', 'error');
                resetUI(); // 重置界面
            };

            // 开始读取文件内容，将其作为 Data URL 读取
            reader.readAsDataURL(file);

        } else if (file) {
            // 如果选择了文件但类型不是图片
            showMessage('请选择一个图片文件 (例如 PNG, JPG, GIF, WEBP)。', 'error');
            resetUI(); // 重置界面
        } else {
             // 如果用户没有选择文件（例如点击了取消）
             console.log("No file selected or selection cancelled.");
             // 根据需要决定是否重置界面，通常不需要，除非之前有预览
             // resetUI();
        }
    });

}); // 结束 DOMContentLoaded 事件监听器

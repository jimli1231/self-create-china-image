document.addEventListener('DOMContentLoaded', () => {
    const scrollWrapper = document.getElementById('scrollWrapper');
    const scrollContent = document.getElementById('scrollContent');
    const imageContainer = document.getElementById('imageContainer');
    const scrollImage = document.getElementById('scrollImage');
    const openSound = document.getElementById('openSound');
    const bgm = document.getElementById('bgm');
    const poemColumns = document.querySelectorAll('.poem-column');
    const poemContainer = document.getElementById('poemContainer');
    
    let isOpen = false;
    let animationId = null;
    let currentPosition = 0;
    let imageLoaded = false;
    let scaledImageWidth = 0;
    let poemTimeouts = [];

    // 总动画时长（秒）- 与画面滚动同步
    const TOTAL_DURATION = 60;
    
    // 图片加载处理
    function handleImageLoad() {
        if (scrollImage.naturalWidth > 0 && scrollImage.naturalHeight > 0) {
            imageLoaded = true;
            updateImageSize();
        }
    }

    // 更新图片尺寸
    function updateImageSize() {
        if (!imageLoaded) return;
        
        const containerHeight = scrollContent.clientHeight || window.innerHeight * 0.7;
        const ratio = containerHeight / scrollImage.naturalHeight;
        scaledImageWidth = scrollImage.naturalWidth * ratio;
        
        imageContainer.style.width = scaledImageWidth + 'px';
        scrollImage.style.height = containerHeight + 'px';
        scrollImage.style.width = scaledImageWidth + 'px';
    }

    // 检查图片是否已加载
    if (scrollImage.complete && scrollImage.naturalWidth > 0) {
        handleImageLoad();
    } else {
        scrollImage.onload = handleImageLoad;
    }

    scrollWrapper.addEventListener('click', () => {
        if (!isOpen) {
            // 打开卷轴
            scrollWrapper.classList.add('open');
            isOpen = true;

            // 先播放开卷音效
            if (openSound) {
                openSound.volume = 0.8;
                openSound.currentTime = 0;
                openSound.play().catch(error => {
                    console.log("Open sound play failed:", error);
                });
                
                // 开卷音效结束后播放背景音乐
                openSound.onended = () => {
                    if (bgm && isOpen) {
                        bgm.volume = 0.5;
                        bgm.play().catch(error => {
                            console.log("BGM play failed:", error);
                        });
                    }
                };
                
                // 备用：3秒后开始播放背景音乐
                setTimeout(() => {
                    if (bgm && isOpen && bgm.paused) {
                        bgm.volume = 0.5;
                        bgm.play().catch(error => {
                            console.log("BGM play failed:", error);
                        });
                    }
                }, 3000);
            } else if (bgm) {
                bgm.volume = 0.5;
                bgm.play().catch(error => {
                    console.log("BGM play failed:", error);
                });
            }

            // 等待卷轴展开后开始动画
            setTimeout(() => {
                updateImageSize();
                startImageScroll();
                revealPoems();
            }, 2800);

        } else {
            // 关闭卷轴
            scrollWrapper.classList.remove('open');
            isOpen = false;
            
            // 停止所有音频
            if (openSound) {
                openSound.pause();
                openSound.currentTime = 0;
            }
            if (bgm) {
                bgm.pause();
                bgm.currentTime = 0;
            }
            
            // 停止动画
            stopImageScroll();
            
            // 清除所有定时器
            poemTimeouts.forEach(t => clearTimeout(t));
            poemTimeouts = [];
            
            // 重置
            resetPoems();
            currentPosition = 0;
            imageContainer.style.transform = 'translateX(0)';
        }
    });

    // 图片滚动动画
    function startImageScroll() {
        const contentWidth = scrollContent.clientWidth;
        const maxScroll = Math.max(0, scaledImageWidth - contentWidth);
        
        if (maxScroll <= 0) {
            return;
        }
        
        // 滚动速度：TOTAL_DURATION 秒完成整个滚动
        const duration = TOTAL_DURATION * 1000;
        const pixelsPerSecond = maxScroll / (duration / 1000);
        const pixelsPerFrame = pixelsPerSecond / 60;
        
        function animate() {
            if (!isOpen) return;
            
            if (currentPosition < maxScroll) {
                currentPosition += pixelsPerFrame;
                if (currentPosition > maxScroll) {
                    currentPosition = maxScroll;
                }
                imageContainer.style.transform = `translateX(-${currentPosition}px)`;
                animationId = requestAnimationFrame(animate);
            }
        }
        
        animationId = requestAnimationFrame(animate);
    }

    function stopImageScroll() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    // 逐步显示诗歌文字，与画面滚动同步
    function revealPoems() {
        const totalColumns = poemColumns.length; // 13个元素（12句诗 + 1标题）
        const totalDuration = TOTAL_DURATION * 1000; // 总时长（毫秒）
        
        // 每句诗的显示间隔，与画面滚动同步
        const showInterval = totalDuration / totalColumns;
        
        // 先铺满画面的数量（6句后才开始消失）
        const fillCount = 6;
        
        poemColumns.forEach((column, index) => {
            const delay = parseInt(column.dataset.delay) || index;
            
            // 显示当前诗句 - 与画面滚动同步
            const showTime = delay * showInterval;
            const showTimeout = setTimeout(() => {
                if (isOpen) {
                    column.classList.remove('fading');
                    column.classList.add('visible');
                }
            }, showTime + 500);
            poemTimeouts.push(showTimeout);
            
            // 标题列不消失
            if (column.classList.contains('title-column')) {
                return;
            }
            
            // 铺满画面后再开始消失
            const fadeDelay = delay + fillCount;
            const fadeTime = fadeDelay * showInterval;
            
            // 确保消失时间不超过总时长
            if (fadeTime < totalDuration) {
                const fadeTimeout = setTimeout(() => {
                    if (isOpen) {
                        column.classList.remove('visible');
                        column.classList.add('fading');
                    }
                }, fadeTime + 500);
                poemTimeouts.push(fadeTimeout);
            }
        });
    }

    // 重置诗歌显示
    function resetPoems() {
        poemColumns.forEach(column => {
            column.classList.remove('visible');
            column.classList.remove('fading');
        });
    }

    // 窗口大小变化时重新计算
    window.addEventListener('resize', () => {
        updateImageSize();
    });
});

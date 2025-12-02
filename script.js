document.addEventListener('DOMContentLoaded', () => {
    // ========== 资源预加载 ==========
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingBar = document.getElementById('loadingBar');
    const mainContainer = document.getElementById('mainContainer');
    
    // 需要预加载的资源
    const resources = {
        images: [
            'image.png',
            'scroll_paper.png',
            'handle_texture.png'
        ],
        audio: [
            'open.wav',
            'music.mp3'
        ]
    };
    
    let loadedCount = 0;
    const totalResources = resources.images.length + resources.audio.length;
    
    function updateProgress() {
        loadedCount++;
        const progress = (loadedCount / totalResources) * 100;
        loadingBar.style.width = progress + '%';
        
        if (loadedCount >= totalResources) {
            // 所有资源加载完成
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
                mainContainer.classList.add('loaded');
                initScrollApp();
            }, 500);
        }
    }
    
    function loadImage(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                updateProgress();
                resolve();
            };
            img.onerror = () => {
                console.log('Image load failed:', src);
                updateProgress(); // 即使失败也继续
                resolve();
            };
            img.src = src;
        });
    }
    
    function loadAudio(src) {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => {
                updateProgress();
                resolve();
            };
            audio.onerror = () => {
                console.log('Audio load failed:', src);
                updateProgress(); // 即使失败也继续
                resolve();
            };
            audio.src = src;
            audio.load();
        });
    }
    
    // 开始预加载
    resources.images.forEach(src => loadImage(src));
    resources.audio.forEach(src => loadAudio(src));
    
    // 超时保护：10秒后强制显示
    setTimeout(() => {
        if (!loadingOverlay.classList.contains('hidden')) {
            loadingOverlay.classList.add('hidden');
            mainContainer.classList.add('loaded');
            initScrollApp();
        }
    }, 10000);
    
    // ========== 卷轴应用逻辑 ==========
    function initScrollApp() {
        const scrollWrapper = document.getElementById('scrollWrapper');
        const scrollContent = document.getElementById('scrollContent');
        const imageContainer = document.getElementById('imageContainer');
        const scrollImage = document.getElementById('scrollImage');
        const openSound = document.getElementById('openSound');
        const bgm = document.getElementById('bgm');
        const poemColumns = document.querySelectorAll('.poem-column');
        
        let isOpen = false;
        let animationId = null;
        let currentPosition = 0;
        let imageLoaded = false;
        let scaledImageWidth = 0;
        let poemTimeouts = [];

        // 总动画时长（秒）
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

        // 诗歌显示
        function revealPoems() {
            const totalColumns = poemColumns.length;
            const totalDuration = TOTAL_DURATION * 1000;
            const showInterval = totalDuration / totalColumns;
            const fillCount = 6;
            
            poemColumns.forEach((column, index) => {
                const delay = parseInt(column.dataset.delay) || index;
                
                const showTime = delay * showInterval;
                const showTimeout = setTimeout(() => {
                    if (isOpen) {
                        column.classList.remove('fading');
                        column.classList.add('visible');
                    }
                }, showTime + 500);
                poemTimeouts.push(showTimeout);
                
                if (column.classList.contains('title-column')) {
                    return;
                }
                
                const fadeDelay = delay + fillCount;
                const fadeTime = fadeDelay * showInterval;
                
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

        function resetPoems() {
            poemColumns.forEach(column => {
                column.classList.remove('visible');
                column.classList.remove('fading');
            });
        }

        window.addEventListener('resize', () => {
            updateImageSize();
        });
    }
});

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
    let isInitialized = false;
    
    // 更新进度条
    function updateProgress() {
        loadedCount++;
        const progress = (loadedCount / totalResources) * 100;
        loadingBar.style.width = progress + '%';
        
        console.log(`加载进度: ${loadedCount}/${totalResources} (${progress.toFixed(0)}%)`);
        
        if (loadedCount >= totalResources && !isInitialized) {
            onAllResourcesLoaded();
        }
    }
    
    // 所有资源加载完成
    function onAllResourcesLoaded() {
        if (isInitialized) return;
        isInitialized = true;
        
        console.log('所有资源加载完成，显示卷轴');
        
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
            mainContainer.classList.add('loaded');
            initScrollApp();
        }, 500);
    }
    
    // 加载图片
    function loadImage(src) {
        const img = new Image();
        
        img.onload = () => {
            console.log('图片加载成功:', src);
            updateProgress();
        };
        
        img.onerror = () => {
            console.warn('图片加载失败:', src);
            updateProgress(); // 失败也继续
        };
        
        img.src = src;
    }
    
    // 加载音频 - 使用多种事件确保触发
    function loadAudio(src) {
        const audio = new Audio();
        let loaded = false;
        
        const markLoaded = () => {
            if (!loaded) {
                loaded = true;
                console.log('音频加载成功:', src);
                updateProgress();
            }
        };
        
        // 多个事件监听，确保至少一个触发
        audio.oncanplaythrough = markLoaded;
        audio.onloadeddata = markLoaded;
        audio.oncanplay = markLoaded;
        
        audio.onerror = () => {
            if (!loaded) {
                loaded = true;
                console.warn('音频加载失败:', src);
                updateProgress();
            }
        };
        
        // 超时保护：单个音频3秒后强制标记完成
        setTimeout(() => {
            if (!loaded) {
                loaded = true;
                console.warn('音频加载超时:', src);
                updateProgress();
            }
        }, 3000);
        
        audio.src = src;
        audio.load();
    }
    
    // 开始预加载所有资源
    console.log('开始预加载资源...');
    resources.images.forEach(src => loadImage(src));
    resources.audio.forEach(src => loadAudio(src));
    
    // 总超时保护：8秒后强制显示
    setTimeout(() => {
        if (!isInitialized) {
            console.warn('预加载超时，强制显示');
            onAllResourcesLoaded();
        }
    }, 8000);
    
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

        const TOTAL_DURATION = 60;
        
        function handleImageLoad() {
            if (scrollImage.naturalWidth > 0 && scrollImage.naturalHeight > 0) {
                imageLoaded = true;
                updateImageSize();
            }
        }

        function updateImageSize() {
            if (!imageLoaded) return;
            
            const containerHeight = scrollContent.clientHeight || window.innerHeight * 0.7;
            const ratio = containerHeight / scrollImage.naturalHeight;
            scaledImageWidth = scrollImage.naturalWidth * ratio;
            
            imageContainer.style.width = scaledImageWidth + 'px';
            scrollImage.style.height = containerHeight + 'px';
            scrollImage.style.width = scaledImageWidth + 'px';
        }

        if (scrollImage.complete && scrollImage.naturalWidth > 0) {
            handleImageLoad();
        } else {
            scrollImage.onload = handleImageLoad;
        }

        scrollWrapper.addEventListener('click', () => {
            if (!isOpen) {
                scrollWrapper.classList.add('open');
                isOpen = true;

                if (openSound) {
                    openSound.volume = 0.8;
                    openSound.currentTime = 0;
                    openSound.play().catch(error => {
                        console.log("Open sound play failed:", error);
                    });
                    
                    openSound.onended = () => {
                        if (bgm && isOpen) {
                            bgm.volume = 0.5;
                            bgm.play().catch(error => {
                                console.log("BGM play failed:", error);
                            });
                        }
                    };
                    
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

                setTimeout(() => {
                    updateImageSize();
                    startImageScroll();
                    revealPoems();
                }, 2800);

            } else {
                scrollWrapper.classList.remove('open');
                isOpen = false;
                
                if (openSound) {
                    openSound.pause();
                    openSound.currentTime = 0;
                }
                if (bgm) {
                    bgm.pause();
                    bgm.currentTime = 0;
                }
                
                stopImageScroll();
                
                poemTimeouts.forEach(t => clearTimeout(t));
                poemTimeouts = [];
                
                resetPoems();
                currentPosition = 0;
                imageContainer.style.transform = 'translateX(0)';
            }
        });

        function startImageScroll() {
            const contentWidth = scrollContent.clientWidth;
            const maxScroll = Math.max(0, scaledImageWidth - contentWidth);
            
            if (maxScroll <= 0) return;
            
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
                
                if (column.classList.contains('title-column')) return;
                
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

const fs = require('fs');

const text = fs.readFileSync('cleaned_text.txt', 'utf8');
const lines = text.split('\n');

const chapters = [
  { name: 'Phần mở đầu', start: 0, end: 455, title: 'PHẦN MỞ ĐẦU: KHĂN GIẤY, ỨNG DỤNG' },
  { name: 'Ngày 1', start: 455, end: 1885, title: 'NGÀY 1: NHÌN' },
  { name: 'Ngày 2', start: 1885, end: 4704, title: 'NGÀY 2: THẤY' },
  { name: 'Ngày 3', start: 4704, end: 5867, title: 'NGÀY 3: HÌNH DUNG' },
  { name: 'Ngày 4', start: 5867, end: lines.length, title: 'NGÀY 4: TRÌNH BÀY' }
];

const template = (chName, chTitle, content, prev, next) => `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${chName} — Hình Vẽ Thông Minh</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
</head>
<body>
    <!-- READING PROGRESS BAR -->
    <div id="reading-progress">
        <div id="reading-progress-bar"></div>
    </div>

    <!-- TOP NAVIGATION -->
    <nav class="top-nav">
        <div class="nav-left">
            <a href="index.html" class="nav-icon"><i class="fas fa-home"></i><span class="icon-label">Trang chủ</span></a>
            <button class="nav-icon" id="btn-toc" onclick="openSidebar('sidebar-toc')"><i class="fas fa-list-ul"></i><span class="icon-label">Mục lục</span></button>
            <button class="nav-icon" id="btn-info" onclick="openSidebar('sidebar-info')"><i class="fas fa-info-circle"></i><span class="icon-label">Thông tin</span></button>
        </div>
        <div class="nav-center">
            <span class="book-title">HÌNH VẼ THÔNG MINH</span>
            <span class="chapter-title">${chTitle}</span>
        </div>
        <div class="nav-right">
            <button class="nav-icon" id="btn-audio"><i class="fas fa-headphones"></i><span class="icon-label">Giọng đọc</span></button>
            <button class="nav-icon" id="btn-fullscreen"><i class="fas fa-expand"></i><span class="icon-label">Toàn màn hình</span></button>
            <button class="nav-icon" id="btn-settings" onclick="toggleSettings()"><i class="fas fa-cog"></i><span class="icon-label">Cài đặt</span></button>
        </div>
    </nav>

    <!-- CHAPTER NAV ARROWS -->
    ${prev ? `<a href="${prev}" class="nav-arrow left"><i class="fas fa-chevron-left"></i></a>` : ''}
    ${next ? `<a href="${next}" class="nav-arrow right"><i class="fas fa-chevron-right"></i></a>` : ''}

    <!-- SIDEBAR: TOC -->
    <div class="sidebar" id="sidebar-toc">
        <div class="sidebar-header">Mục lục cuốn sách</div>
        <div class="sidebar-body">
            <ul class="toc-list">
                <li class="${chName === 'Phần mở đầu' ? 'active' : ''}"><a href="c1.html">Phần mở đầu: Khăn giấy, ứng dụng</a></li>
                <li class="${chName === 'Ngày 1' ? 'active' : ''}"><a href="c2.html">Ngày 1: Nhìn</a></li>
                <li class="${chName === 'Ngày 2' ? 'active' : ''}"><a href="c3.html">Ngày 2: Thấy</a></li>
                <li class="${chName === 'Ngày 3' ? 'active' : ''}"><a href="c4.html">Ngày 3: Hình dung</a></li>
                <li class="${chName === 'Ngày 4' ? 'active' : ''}"><a href="c5.html">Ngày 4: Trình bày</a></li>
            </ul>
        </div>
    </div>

    <!-- SIDEBAR: INFO -->
    <div class="sidebar" id="sidebar-info">
        <div class="sidebar-header">Thông tin tác phẩm</div>
        <div class="sidebar-body">
            <div class="info-card">
                <img src="IMG/bìa.png" alt="Bìa sách">
                <h3>Hình Vẽ Thông Minh</h3>
                <p class="author">Dan Roam</p>
                <div class="summary">
                    Giải quyết mọi vấn đề phức tạp bằng những hình vẽ đơn giản. Khám phá phương pháp tư duy hình ảnh đã chinh phục Microsoft, Google, Boeing và Thượng viện Hoa Kỳ.
                </div>
            </div>
        </div>
    </div>

    <!-- SETTINGS PANEL -->
    <div class="settings-panel" id="settings-panel">
        <div class="panel-title">Cài đặt giao diện</div>
        
        <div class="section">
            <div class="section-title">Tìm kiếm</div>
            <div class="search-box">
                <input type="text" id="input-search" placeholder="Nhập từ khóa...">
                <button onclick="handleSearch()"><i class="fas fa-search"></i></button>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Chủ đề màu sắc</div>
            <div class="theme-grid">
                <button class="t-btn t-light" onclick="changeTheme('light')"><span>Sáng</span></button>
                <button class="t-btn t-sepia" onclick="changeTheme('sepia')"><span>Cổ điển</span></button>
                <button class="t-btn t-dark" onclick="changeTheme('dark')"><span>Tối</span></button>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Phông chữ & Cỡ chữ</div>
            <select class="font-dropdown" onchange="changeFont(this.value)">
                <option value="'Lora', serif">Lora (Serif)</option>
                <option value="'Inter', sans-serif">Inter (Sans-serif)</option>
                <option value="Georgia, serif">Georgia</option>
            </select>
            <div class="control-row">
                <span class="label">Cỡ chữ</span>
                <div class="btn-group">
                    <button onclick="updateFont(-1)"><i class="fas fa-minus"></i></button>
                    <button onclick="updateFont(1)"><i class="fas fa-plus"></i></button>
                </div>
            </div>
            <div class="control-row">
                <span class="label">Giãn dòng</span>
                <div class="btn-group">
                    <button onclick="updateLineHeight(-0.1)"><i class="fas fa-minus"></i></button>
                    <button onclick="updateLineHeight(0.1)"><i class="fas fa-plus"></i></button>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Công cụ highlight</div>
            <div class="highlight-colors">
                <div class="hl-color hl-yellow" onclick="setHLColor('yellow')"></div>
                <div class="hl-color hl-green" onclick="setHLColor('green')"></div>
                <div class="hl-color hl-blue" onclick="setHLColor('blue')"></div>
                <div class="hl-color hl-pink" onclick="setHLColor('pink')"></div>
            </div>
            <div class="action-grid">
                <button class="btn-action highlight" onclick="doHighlight()"><i class="fas fa-highlighter"></i> Đánh dấu</button>
                <button class="btn-action eraser" onclick="clearAllHighlights()"><i class="fas fa-eraser"></i></button>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Cuộn tự động</div>
            <div class="autoscroll-row">
                <span class="label">Kích hoạt</span>
                <label class="toggle-switch">
                    <input type="checkbox" id="autoscroll-toggle" onchange="toggleAutoScroll()">
                    <span class="toggle-slider"></span>
                </label>
            </div>
            <div class="control-row">
                <span class="label">Tốc độ: <span id="scroll-speed-label">1.5x</span></span>
            </div>
            <input type="range" class="speed-slider" min="0.5" max="5" step="0.5" value="1.5" oninput="updateScrollSpeed(this.value)">
        </div>

        <div class="section music-section">
            <div class="section-title">Nhạc nền tập trung</div>
            <div class="music-tracks">
                <div class="music-track" id="btn-music-rain" onclick="playTrack('rain')"><i class="fas fa-cloud-showers-heavy"></i> Mưa nhẹ</div>
                <div class="music-track" id="btn-music-forest" onclick="playTrack('forest')"><i class="fas fa-leaf"></i> Rừng xanh</div>
                <div class="music-track" id="btn-music-cafe" onclick="playTrack('cafe')"><i class="fas fa-coffee"></i> Quán cà phê</div>
                <div class="music-track" id="btn-music-ocean" onclick="playTrack('ocean')"><i class="fas fa-water"></i> Biển đêm</div>
            </div>
            <div class="vol-row">
                <i class="fas fa-volume-down"></i>
                <input type="range" class="vol-slider" min="0" max="1" step="0.1" value="0.5" oninput="updateMusicVolume(this.value)">
                <i class="fas fa-volume-up"></i>
            </div>
        </div>
    </div>

    <!-- TTS STATUS -->
    <div id="tts-status">
        <div class="pulse-dot"></div>
        <span>Đang đọc...</span>
    </div>

    <!-- MAIN READER AREA -->
    <div class="reader-container">
        <div class="paper" id="reader-content">
            <h2 class="content-h2">${chTitle}</h2>
            <div id="book-content">
                ${content}
            </div>
        </div>
    </div>

    <!-- BOTTOM_BAR -->

    <!-- BACK TO TOP -->
    <button id="btn-back-to-top" title="Lên đầu trang"><i class="fas fa-arrow-up"></i></button>

    <script src="reader.js"></script>
    <script src="music.js"></script>
</body>
</html>`;

chapters.forEach((ch, index) => {
    const chapterLines = lines.slice(ch.start, ch.end);
    let processedLines = [];
    
    for (let i = 0; i < chapterLines.length; i++) {
        let line = chapterLines[i].trim();
        if (!line) {
            processedLines.push('');
            continue;
        }

        // Fix Drop Caps / Broken Words (Single letter on its own line)
        if (line.length === 1 && /[A-Z]/.test(line)) {
            let nextIdx = i + 1;
            while (nextIdx < chapterLines.length && !chapterLines[nextIdx].trim()) nextIdx++;
            if (nextIdx < chapterLines.length) {
                let nextLine = chapterLines[nextIdx].trim();
                // If next line starts with lowercase, it's a broken word
                if (/^[a-zà-ỹ]/.test(nextLine)) {
                    line = line + nextLine;
                    i = nextIdx; // Skip merged line
                }
            }
        }

        // Clean up escaped characters and common artifacts
        line = line.replace(/\\([.\-!$])/g, '$1');
        line = line.replace(/_/g, ''); // Remove stray underscores

        // Headers
        if (line.startsWith('### ')) {
            processedLines.push(`<h3>${line.substring(4)}</h3>`);
        } else if (line.startsWith('## ')) {
            processedLines.push(`<h3>${line.substring(3)}</h3>`);
        } else if (line.startsWith('# ')) {
            processedLines.push(`<h3>${line.substring(2)}</h3>`);
        } 
        // Images: "HÌNH 1" or "HINH 1" -> <img src="IMG/1.png">
        else if (/H[ÌÍI]NH\s+(\d+)/i.test(line)) {
            const num = line.match(/H[ÌÍI]NH\s+(\d+)/i)[1];
            processedLines.push(`<div class="content-image"><img src="IMG/${num}.png" alt="Hình ${num}"><span>Hình ${num}</span></div>`);
        }
        else {
            processedLines.push(`<p>${line}</p>`);
        }
    }

    let htmlContent = processedLines.join('\n');

    const fileName = `c${index + 1}.html`;
    const prev = index > 0 ? `c${index}.html` : null;
    const next = index < chapters.length - 1 ? `c${index + 2}.html` : null;
    
    const finalHtml = template(ch.name, ch.title, htmlContent, prev, next)
        .replace('<!-- BOTTOM_BAR -->', `
        <div class="bottom-progress-bar">
            <div class="bottom-left">
                <span>Chương ${index + 1}</span>
            </div>
            <div class="bottom-center">
                <input type="range" class="bottom-slider" id="bottom-slider" min="0" max="100" value="0">
            </div>
            <div class="bottom-right">
                <span id="bottom-pct">0%</span>
            </div>
        </div>
        `);

    fs.writeFileSync(fileName, finalHtml);
    console.log(`Saved ${fileName}`);
});

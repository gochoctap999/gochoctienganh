// ==========================================
// CẤU HÌNH VÀ XỬ LÝ ĐĂNG NHẬP FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAEFYjvtvTDsotYhaLqG7mdSTAhqccXLW4",
  authDomain: "goc-tieng-anh.firebaseapp.com",
  projectId: "goc-tieng-anh",
  storageBucket: "goc-tieng-anh.firebasestorage.app",
  messagingSenderId: "455923068807",
  appId: "1:455923068807:web:a94b036fac565f6ffcad22"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// Hàm Xử lý Đăng nhập
window.signInWithGoogle = () => {
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log("Đăng nhập thành công:", result.user.displayName);
        }).catch((error) => {
            console.error("Lỗi đăng nhập:", error);
        });
};

// Hàm Xử lý Đăng xuất
window.signOutUser = () => {
    auth.signOut().then(() => {
        console.log("Đã đăng xuất");
    });
};

// Theo dõi trạng thái người dùng
auth.onAuthStateChanged((user) => {
    const loginView = document.getElementById('login-view');
    const userView = document.getElementById('user-view');
    
    // Nếu trang hiện tại không có phần login thì bỏ qua, tránh lỗi
    if (!loginView || !userView) return; 

    if (user) {
        // Đã đăng nhập: Ẩn nút Login, hiện Avatar và Tên
        loginView.classList.add('hidden');
        userView.classList.remove('hidden');
        
        const userNameEl = document.getElementById('user-name');
        const userAvatarEl = document.getElementById('user-avatar');
        
        if (userNameEl) userNameEl.innerText = user.displayName;
        if (userAvatarEl) userAvatarEl.src = user.photoURL;
    } else {
        // Chưa đăng nhập: Hiện nút Login
        loginView.classList.remove('hidden');
        userView.classList.add('hidden');
    }
});

// ==========================================
// 1. QUẢN LÝ TRẠNG THÁI & DỮ LIỆU (LOCALSTORAGE)
// ==========================================
let folders = JSON.parse(localStorage.getItem('folders')) || [];
let quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];

// Dọn rác
const validFolderIds = folders.map(f => String(f.id));
const cleanQuizzes = quizzes.filter(q => validFolderIds.includes(String(q.folderId)));
if (cleanQuizzes.length !== quizzes.length) {
    quizzes = cleanQuizzes;
    localStorage.setItem('quizzes', JSON.stringify(quizzes));
}

let currentTestQuestions = []; 
let userAnswers = {};
let currentFolderId = null;
let currentQuizId = null;

// ==========================================
// 2. SỰ KIỆN KHI TẢI TRANG (DOM CONTENT LOADED)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Kiểm tra nếu đang ở trang Luyện đề (exams.html)
    if (document.getElementById('exam-folder-list')) {
        renderExamFolders();
    }
    // === QUẢN LÝ CÂU NÓI TRUYỀN ĐỘNG LỰC NGẪU NHIÊN ===
    const motivationalQuotes = [
        "Mỗi ngày cố gắng một chút, tương lai sẽ rực rỡ một chút 🌸",
        "Kỷ luật là cầu nối giữa mục tiêu và thành tựu 🎯",
        "Đừng dừng lại khi mệt mỏi, hãy dừng lại khi đã hoàn thành ✨",
        "Học tập là hạt giống của kiến thức, kiến thức là hạt giống hạnh phúc 🌱",
        "Hôm nay khó khăn, ngày mai còn khó khăn hơn, nhưng ngày kia sẽ là ngày tuyệt vời ☀️",
        "Thành công là kết quả của sự hoàn hảo, làm việc chăm chỉ và rút kinh nghiệm từ thất bại 💎"
    ];
    
    const quoteEl = document.getElementById('motivational-quote');
    if (quoteEl) {
        // Random câu nói
        const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
        quoteEl.innerText = randomQuote;
    }
    // ==============================================================
    // Thu nhỏ Sidebar
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('btn-toggle-sidebar');
    const sidebarIcon = document.getElementById('sidebar-icon');

    if (toggleSidebarBtn && sidebar && sidebarIcon) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            if (sidebar.classList.contains('collapsed')) {
                sidebarIcon.classList.remove('fa-angles-left');
                sidebarIcon.classList.add('fa-angles-right');
            } else {
                sidebarIcon.classList.remove('fa-angles-right');
                sidebarIcon.classList.add('fa-angles-left');
            }
        });
    }

    // Chuyển đổi Dark Mode
    const toggleDarkModeBtn = document.getElementById('btn-darkmode');
    const modeIcon = document.getElementById('mode-icon');
    const modeText = document.getElementById('mode-text');
    let isDark = false;

    if (toggleDarkModeBtn) {
        toggleDarkModeBtn.addEventListener('click', () => {
            isDark = !isDark;
            if (isDark) {
                document.body.style.background = '#1e293b'; 
                document.body.classList.add('text-slate-100');
                document.body.classList.remove('text-gray-800');
                if (modeText) modeText.textContent = 'Sáng';
                if (modeIcon) {
                    modeIcon.classList.remove('fa-moon');
                    modeIcon.classList.add('fa-sun');
                }
            } else {
                // Trả về nền gradient trong trẻo
                document.body.style.background = 'linear-gradient(180deg, #ffe5ec 0%, #fff0f3 25%, #ffffff 60%, #ffffff 100%)';
                document.body.classList.add('text-gray-800');
                document.body.classList.remove('text-slate-100');
                if (modeText) modeText.textContent = 'Tối';
                if (modeIcon) {
                    modeIcon.classList.remove('fa-sun');
                    modeIcon.classList.add('fa-moon');
                }
            }
        });
    }

    // Nút chức năng (Giả lập)
    const filterButtons = document.querySelectorAll('main button');
    filterButtons.forEach(btn => {
        if (!btn.innerText.includes('NÂNG CẤP') && !btn.id) {
            btn.addEventListener('click', () => {
                console.log(`Đang thao tác: ${btn.innerText.trim()}`);
            });
        }
    });

    // Khởi tạo các Component
    if (document.getElementById('folder-list')) {
        renderFolders();
        updateFolderSelect();
    }
    // ---> ĐOẠN NÀY ĐỂ FIX LỖI TRANG BỘ TỪ VỰNG <---
    if (document.getElementById('vocab-folder-list')) {
        renderVocabFolders();
        updateVocabSelects();
    }
    // ---> ĐOẠN NÀY CHO TRANG VOCAB.HTML <---
    if (document.getElementById('all-vocab-list')) {
        renderAllVocabList();
    }
    // --------------------------------------------------------
    
    // Gọi hàm render hiển thị ngoài trang chủ
    // Gọi hàm render hiển thị ngoài trang chủ
    renderHomeGrammar();
    renderHistory();
});

// ==========================================
// 3. LOGIC ĐIỀU HƯỚNG GIAO DIỆN GRAMMAR
// ==========================================
function goHome() {
    document.getElementById('view-folder').style.display = 'none';
    document.getElementById('view-quiz').style.display = 'none';
    document.getElementById('view-home').style.display = 'block';
    currentFolderId = null;
    currentQuizId = null;
    renderFolders();
}

function openFolder(folderId) {
    currentFolderId = folderId;
    document.getElementById('view-home').style.display = 'none';
    document.getElementById('view-quiz').style.display = 'none';
    document.getElementById('view-folder').style.display = 'block';
    
    const folder = folders.find(f => f.id == folderId);
    document.getElementById('current-folder-name').innerText = '📁 ' + folder.name;
    
    const backBtn = document.getElementById('folder-back-btn');
    if (folder.parentId) {
        backBtn.innerText = '← Quay lại Thư mục mẹ';
        backBtn.onclick = () => openFolder(folder.parentId);
    } else {
        backBtn.innerText = '← Quay lại Trang chủ';
        backBtn.onclick = goHome;
    }
    renderQuizzes();
}

function goBackToFolder() {
    document.getElementById('view-quiz').style.display = 'none';
    document.getElementById('view-folder').style.display = 'block';
    currentQuizId = null;
}

function openQuiz(quizId) {
    currentQuizId = quizId;
    document.getElementById('view-folder').style.display = 'none';
    document.getElementById('view-quiz').style.display = 'block';
    
    const quiz = quizzes.find(q => q.id == quizId);
    document.getElementById('current-quiz-name').innerText = '📄 ' + quiz.name;
    renderQuestionsPreview(quiz.questions);
}

function getAllFolderIds(folderId) {
    let ids = [String(folderId)];
    let children = folders.filter(f => f.parentId == folderId).map(f => String(f.id));
    children.forEach(childId => {
        ids = ids.concat(getAllFolderIds(childId));
    });
    return ids;
}

// ==========================================
// 4. HIỂN THỊ DỮ LIỆU RA MÀN HÌNH (RENDER CÁC THẺ TAILWIND)
// ==========================================
function renderFolders() {
    let folders = JSON.parse(localStorage.getItem('folders')) || [];
    const list = document.getElementById('folder-list');
    if (!list) return;
    list.innerHTML = '';
    
    const rootFolders = folders.filter(f => !f.parentId);
    rootFolders.forEach(f => {
        const childFolders = folders.filter(sub => sub.parentId == f.id).length;
        const allIds = getAllFolderIds(f.id);
        const quizCount = quizzes.filter(q => allIds.includes(String(q.folderId))).length;
        
        // Thêm class h-40 để đồng bộ kích thước
list.innerHTML += `
<div class="folder-card cursor-pointer" onclick="openFolder(${f.id})">
    <div class="flex items-center gap-4">
        <!-- Icon Folder màu hồng pastel -->
        <div class="text-[32px] text-[#ffb3c6]">
            <i class="fa-solid fa-folder"></i>
        </div>
        <div>
            <h4 class="font-extrabold text-[#2d3748] text-lg leading-tight">${f.name}</h4>
        </div>
    </div>
    <div class="mt-5 flex gap-2">
        <span class="folder-tag">${childFolders} thư mục con</span>
        <span class="folder-tag">${quizCount} đề thi</span>
    </div>
</div>`;
    });
}
function renderExamFolders() {
    let folders = JSON.parse(localStorage.getItem('examFolders')) || [];
    const list = document.getElementById('folder-list');
    if (!list) return;
    list.innerHTML = '';
    
    const rootFolders = folders.filter(f => !f.parentId);
    rootFolders.forEach(f => {
        const childFolders = folders.filter(sub => sub.parentId == f.id).length;
        const allIds = getAllFolderIds(f.id);
        const quizCount = quizzes.filter(q => allIds.includes(String(q.folderId))).length;
        
        // Thêm class h-40 để đồng bộ kích thước
list.innerHTML += `
<div class="folder-card cursor-pointer" onclick="openFolder(${f.id})">
    <div class="flex items-center gap-4">
        <!-- Icon Folder màu hồng pastel -->
        <div class="text-[32px] text-[#ffb3c6]">
            <i class="fa-solid fa-folder"></i>
        </div>
        <div>
            <h4 class="font-extrabold text-[#2d3748] text-lg leading-tight">${f.name}</h4>
        </div>
    </div>
    <div class="mt-5 flex gap-2">
        <span class="folder-tag">${childFolders} thư mục con</span>
        <span class="folder-tag">${quizCount} đề thi</span>
    </div>
</div>`;
    });
}

function renderQuizzes() {
    const list = document.getElementById('quiz-list');
    if (!list) return;
    list.innerHTML = '';
    
    const subFolders = folders.filter(f => f.parentId == currentFolderId);
    const folderQuizzes = quizzes.filter(q => q.folderId == currentFolderId);
    
    if (subFolders.length === 0 && folderQuizzes.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-sm">Chưa có dữ liệu nào trong thư mục này.</p>';
        return;
    }

    // Hiển thị Thư mục con
    subFolders.forEach(f => {
        const childCount = folders.filter(sub => sub.parentId == f.id).length;
        const allIds = getAllFolderIds(f.id);
        const quizCount = quizzes.filter(q => allIds.includes(String(q.folderId))).length;
        
        list.innerHTML += `
        <div class="bg-[#eef5ff] border-2 border-[#dbeafe] rounded-3xl p-5 cursor-pointer hover:shadow-md transition-all relative group flex items-center gap-4" onclick="openQuiz(${q.id})">
        <!-- Icon file tài liệu -->
        <div class="text-2xl text-blue-500">
            <i class="fa-solid fa-file-lines"></i>
        </div>
        
        <div class="flex-1">
            <h4 class="font-extrabold text-[#2d3748] text-[16px]">${q.name}</h4>
            <p class="text-blue-500 text-sm font-bold">${q.questions.length} Câu hỏi</p>
        </div>

        <!-- Nút xóa/sửa vẫn giữ nguyên nhưng ẩn đi cho gọn -->
        <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
            <button onclick="editQuizFromList(event, ${q.id})" class="text-[#94a3b8] hover:text-[#3b82f6]"><i class="fa-solid fa-pen text-sm"></i></button>
            <button onclick="deleteQuizFromList(event, ${q.id})" class="text-[#94a3b8] hover:text-[#ef4444]"><i class="fa-solid fa-trash-can text-sm"></i></button>
        </div>
    </div>`;
    });

    // Hiển thị Đề thi
    folderQuizzes.forEach(q => {
        list.innerHTML += `
        <div class="bg-white border-2 border-[#ffe4e6] rounded-3xl p-5 cursor-pointer hover:shadow-lg transition-all relative group flex items-center gap-4" onclick="openQuiz(${q.id})">
        
            <div class="text-2xl text-[#ffb3c6]">
                <i class="fa-solid fa-file-lines"></i>
            </div>
            
            <div class="flex-1">
                <h4 class="font-extrabold text-[#2d3748] text-[16px]">${q.name}</h4>
                <p class="text-[#ff9eb5] text-sm font-bold">${q.questions.length} Câu hỏi</p>
            </div>

            <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <button onclick="editQuizFromList(event, ${q.id})" class="text-[#cbd5e1] hover:text-[#ff9eb5]"><i class="fa-solid fa-pen text-sm"></i></button>
                <button onclick="deleteQuizFromList(event, ${q.id})" class="text-[#cbd5e1] hover:text-[#ef4444]"><i class="fa-solid fa-trash-can text-sm"></i></button>
            </div>
        </div>`;
    });
}

function editQuizFromList(event, quizId) {
    event.stopPropagation();
    currentQuizId = quizId;
    openEditQuizModal();
}

function renderQuestionsPreview(questions) {
    const list = document.getElementById('question-preview-list');
    if (!list) return;
    list.innerHTML = '';
    questions.forEach((q, index) => {
        list.innerHTML += `<div class="py-2 border-b border-dashed border-gray-200 text-sm">
            <strong>Câu ${index + 1}:</strong> <span class="text-gray-700">${q.questionText}</span>
        </div>`;
    });
}

// ==========================================
// 5. QUẢN LÝ MODAL & TẠO DỮ LIỆU
// ==========================================
function openModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex'; 
}
function closeModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none'; 
}

function openCreateFolderModal() {
    document.getElementById('folder-name').value = '';
    document.getElementById('folder-desc').value = '';
    const parentSelect = document.getElementById('folder-parent');
    if (currentFolderId && document.getElementById('view-folder').style.display === 'block') {
        parentSelect.value = currentFolderId;
    } else {
        parentSelect.value = "";
    }
    openModal('modal-folder');
}

function openCreateQuizModal() {
    document.getElementById('quiz-name').value = '';
    document.getElementById('quiz-content').value = '';
    const quizSelect = document.getElementById('quiz-folder');
    if (currentFolderId && document.getElementById('view-folder').style.display === 'block') {
        quizSelect.value = currentFolderId;
    } else {
        quizSelect.value = "";
    }
    openModal('modal-quiz');
}

function updateFolderSelect() {
    const quizSelect = document.getElementById('quiz-folder');
    const parentSelect = document.getElementById('folder-parent');
    
    let optionsHTML = '';
    folders.forEach(f => {
        optionsHTML += `<option value="${f.id}">${f.name}</option>`;
    });

    if (quizSelect) quizSelect.innerHTML = '<option value="">-- Chọn thư mục --</option>' + optionsHTML;
    if (parentSelect) parentSelect.innerHTML = '<option value="">-- Đặt làm Thư mục gốc --</option>' + optionsHTML;
}

function saveFolder() {
    const name = document.getElementById('folder-name').value.trim();
    const desc = document.getElementById('folder-desc').value.trim();
    const parentId = document.getElementById('folder-parent').value || null;
    if (!name) return alert("Vui lòng nhập tên thư mục!");
    
    const isDuplicate = folders.some(f => f.parentId == parentId && f.name.toLowerCase() === name.toLowerCase());
    if (isDuplicate) return alert("Tên thư mục đã tồn tại ở cấp này!");
    
    folders.push({ id: Date.now(), name, desc, parentId });
    localStorage.setItem('folders', JSON.stringify(folders));
    
    closeModal('modal-folder');
    updateFolderSelect();
    
    if (currentFolderId && document.getElementById('view-folder').style.display === 'block') {
        renderQuizzes();
    } else {
        renderFolders();
    }
}

function parseRawQuestions(rawText) {
    // 1. Chia khối câu hỏi (dòng trống ngăn cách)
    const blocks = rawText.trim().split(/\n\s*\n/);
    let parsedQuestions = [];

    blocks.forEach((block, index) => {
        // 2. Tách phần giải thích nằm trong ngoặc vuông ra khỏi các dòng câu hỏi
        let explanation = "";
        let contentForParsing = block;

        const expMatch = block.match(/\[([\s\S]*?)\]/);
        if (expMatch) {
            // Lấy nội dung giải thích, thay thế Enter thành <br>
            explanation = expMatch[1].trim().replace(/\n/g, '<br>');
            // Loại bỏ phần giải thích khỏi block để xử lý câu hỏi/đáp án
            contentForParsing = block.replace(expMatch[0], "").trim();
        }

        const lines = contentForParsing.split('\n').map(l => l.trim()).filter(l => l !== "");
        if (lines.length < 2) return;

        let questionText = "";
        let options = [];
        let isReadingOptions = false;
        let correctAnswerIndex = -1;

        lines.forEach(line => {
            if (/^(\*)?[a-zA-Z][\.\)]/.test(line)) {
                isReadingOptions = true;
            }

            if (isReadingOptions) {
                if (line.startsWith('*')) {
                    options.push({ text: line.substring(1).trim(), isCorrect: true });
                    correctAnswerIndex = options.length - 1;
                } else {
                    options.push({ text: line, isCorrect: false });
                }
            } else {
                questionText += (questionText ? "<br>" : "") + line;
            }
        });

        if (correctAnswerIndex === -1) {
            alert(`Lỗi ở câu hỏi số ${index + 1}: Thiếu đáp án đúng (dấu *)`);
            throw new Error("Lỗi Parser");
        }
        
        questionText = questionText.replace(/"(.*?)"/g, '<strong>$1</strong>');
        parsedQuestions.push({ questionText, options, explanation });
    });
    return parsedQuestions;
}

function saveQuiz() {
    const name = document.getElementById('quiz-name').value.trim();
    const folderId = document.getElementById('quiz-folder').value;
    const rawContent = document.getElementById('quiz-content').value;

    if (!name || !folderId || !rawContent) return alert("Vui lòng điền đủ Tên, Thư mục và Nội dung đề!");

    const isDuplicate = quizzes.some(q => q.folderId == folderId && q.name.toLowerCase() === name.toLowerCase());
    if (isDuplicate) return alert("Tên đề thi đã tồn tại trong thư mục này!");

    try {
        const parsedData = parseRawQuestions(rawContent);
        quizzes.push({ id: Date.now(), folderId, name, questions: parsedData });
        localStorage.setItem('quizzes', JSON.stringify(quizzes));
        
        alert("Đã tạo đề thành công!");
        closeModal('modal-quiz');
        
        if (currentFolderId == folderId && document.getElementById('view-folder').style.display === 'block') {
            renderQuizzes();
        } else {
            renderFolders();
        }
    } catch (e) {}
}

function copyExampleFormat() {
    const textToCopy = document.getElementById('example-format').innerText;
    navigator.clipboard.writeText(textToCopy).then(() => alert("Đã sao chép!"))
}

// ==========================================
// 6. LOGIC ĐIỀU HƯỚNG LÀM BÀI VÀ LƯU NGỮ CẢNH (CONTEXT)
// ==========================================
function promptTestOptions(mode) {
    const modal = document.getElementById('modal-do-test');
    if (modal) {
        modal.setAttribute('data-mode', mode);
        openModal('modal-do-test');
    }
}

function startTest(count) {
    const mode = document.getElementById('modal-do-test').getAttribute('data-mode');
    let allQuestions = [];
    let testContext = { name: "Bài tập", folder: "Ngữ pháp" };
    
    if (mode === 'all') {
        quizzes.forEach(q => allQuestions = allQuestions.concat(q.questions));
        testContext = { name: "Ôn tập Toàn bộ", folder: "Hệ thống" };
    } else if (mode === 'folder') {
        const folderIds = getAllFolderIds(currentFolderId);
        const folderQuizzes = quizzes.filter(q => folderIds.includes(String(q.folderId)));
        folderQuizzes.forEach(q => allQuestions = allQuestions.concat(q.questions));
        
        const f = folders.find(x => x.id == currentFolderId);
        testContext = { name: "Ôn tập Thư mục", folder: f ? f.name : "Thư mục" };
    } else if (mode === 'quiz') {
        const quiz = quizzes.find(q => q.id == currentQuizId);
        if (quiz) {
            allQuestions = quiz.questions;
            const f = folders.find(x => x.id == quiz.folderId);
            testContext = { name: quiz.name, folder: f ? f.name : "Thư mục" };
        }
    }

    if (allQuestions.length === 0) return alert("Không có câu hỏi nào để làm!");

    for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    let finalQuestions = count === 'all' ? allQuestions : allQuestions.slice(0, count);
    const currentPage = document.getElementById('view-folder').style.display === 'block' ? 'grammar' : 'history';
    localStorage.setItem('sourcePage', currentPage);
    localStorage.setItem('tempTest', JSON.stringify(finalQuestions));
    localStorage.setItem('tempTestContext', JSON.stringify(testContext));
    localStorage.removeItem('isReviewMode');

    window.location.href = 'grammar-test.html'; 
}

// ==========================================
// 7. LOGIC XỬ LÝ LÀM BÀI (GRAMMAR-TEST.HTML)
// ==========================================

// Sửa hàm initTest thành như sau:
function initTest() {
    const isReview = localStorage.getItem('isReviewMode') === 'true';
    const savedData = localStorage.getItem('tempTest');
    
    if (!savedData) {
        window.location.href = 'grammar.html';
        return;
    }

    // Ẩn nội dung để tránh chớp nhoáng
    const wrapper = document.getElementById('main-content-wrapper');
    if(wrapper) wrapper.style.display = 'none';

    currentTestQuestions = JSON.parse(savedData);
    renderTestQuestions();

    if (isReview) {
        const savedAnswers = JSON.parse(localStorage.getItem('tempReviewAnswers'));
        userAnswers = savedAnswers || {};
        // Áp dụng kết quả xong mới cho hiện lên
        applyReviewState();
        if(wrapper) wrapper.style.display = 'block';
    } else {
        // Nếu là làm bài mới thì hiện ngay
        if(wrapper) wrapper.style.display = 'block';
    }
}

function renderTestQuestions() {
    const list = document.getElementById('question-list');
    const navGrid = document.getElementById('q-nav-grid');
    if (!list || !navGrid) return;
    
    list.innerHTML = '';
    navGrid.innerHTML = '';

    currentTestQuestions.forEach((q, qIndex) => {
        let optionsHTML = '';
        q.options.forEach((opt, oIndex) => {
            optionsHTML += `<button class="block w-full text-left p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl mb-3 font-semibold text-gray-700 hover:border-blue-300 transition-colors option-btn" id="opt-${qIndex}-${oIndex}" onclick="selectOption(${qIndex}, ${oIndex})">${opt.text}</button>`;
        });
        
        let explanationHTML = '';
        if (q.explanation) {
            explanationHTML = `
                <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800 hidden explanation-box" id="exp-${qIndex}">
                    <strong><i class="fa-solid fa-lightbulb text-yellow-500 mr-1"></i> Giải thích:</strong> ${q.explanation}
                </div>`;
        }
        
        list.innerHTML += `
            <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 question-card" id="q-card-${qIndex}">
                <div class="flex gap-4 items-start">
                    <div class="w-10 h-10 shrink-0 bg-[#bde0fe] text-[#2d3748] font-extrabold rounded-full flex items-center justify-center text-lg" id="q-num-${qIndex}">${qIndex + 1}</div>
                    <div class="flex-1">
                        <div class="text-lg font-bold text-gray-800 mb-4 leading-relaxed q-text">${q.questionText}</div>
                        <div class="options-container">${optionsHTML}</div>
                        ${explanationHTML} </div>
                </div>
            </div>`;

        navGrid.innerHTML += `<button class="w-10 h-10 rounded-xl font-bold border-2 border-gray-200 text-gray-500 hover:bg-gray-100 nav-box" id="nav-box-${qIndex}" onclick="scrollToQuestion(${qIndex})">${qIndex + 1}</button>`;
    });
}

function scrollToQuestion(index) {
    const target = document.getElementById(`q-card-${index}`);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function selectOption(qIndex, oIndex) {
    userAnswers[qIndex] = oIndex;
    
    const container = document.getElementById(`q-card-${qIndex}`);
    if (container) {
        const buttons = container.querySelectorAll('.option-btn');
        buttons.forEach(btn => btn.classList.remove('selected'));
    }
    document.getElementById(`opt-${qIndex}-${oIndex}`).classList.add('selected');
    
    const navBox = document.getElementById(`nav-box-${qIndex}`);
    if (navBox) navBox.classList.add('answered');
    
    updateProgress();
}

function updateProgress() {
    const total = currentTestQuestions.length;
    const answered = Object.keys(userAnswers).length;
    
    const progressEl = document.getElementById('test-progress');
    const submitBtn = document.getElementById('submit-test-btn');
    
    if (progressEl) progressEl.innerText = `Tổng số câu hỏi: ${total} | Đã trả lời: ${answered}/${total}`;
    if (submitBtn) submitBtn.innerText = `Nộp bài (${answered}/${total})`;
}

function submitTest() { 
    if (!confirm("Bạn có chắc chắn muốn nộp bài?")) return;

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    const total = currentTestQuestions.length;

    currentTestQuestions.forEach((q, qIndex) => {
        const userAns = userAnswers[qIndex];
        const qCard = document.getElementById(`q-card-${qIndex}`);
        const qNum = document.getElementById(`q-num-${qIndex}`); 
        
        const buttons = qCard.querySelectorAll('.option-btn');
        buttons.forEach(btn => btn.disabled = true);

        let status = ''; 
        const correctIdx = q.options.findIndex(o => o.isCorrect);

        if (userAns === undefined) {
            unansweredCount++;
            status = 'unanswered';
            document.getElementById(`opt-${qIndex}-${correctIdx}`).classList.add('is-correct'); 
            if (qNum) qNum.style.background = '#64748b'; 
        } else {
            const isCorrect = q.options[userAns].isCorrect;
            document.getElementById(`opt-${qIndex}-${userAns}`).classList.remove('selected');

            if (isCorrect) {
                correctCount++;
                status = 'correct';
                document.getElementById(`opt-${qIndex}-${userAns}`).classList.add('is-correct');
                qCard.querySelector('.q-text').innerHTML += ` <span class="text-green-600 ml-2">✔</span>`;
            } else {
                wrongCount++;
                status = 'incorrect';
                document.getElementById(`opt-${qIndex}-${userAns}`).classList.add('is-wrong'); 
                document.getElementById(`opt-${qIndex}-${correctIdx}`).classList.add('is-correct'); 
                qCard.querySelector('.q-text').innerHTML += ` <span class="text-red-500 ml-2">✘</span>`;
                if (qNum) qNum.style.background = '#ef4444'; 
            }
        }
        qCard.setAttribute('data-status', status);
        const expBox = document.getElementById(`exp-${qIndex}`);
        if (expBox) expBox.classList.remove('hidden');
        
    });

    const percent = Math.round((correctCount / total) * 100);

    const ctx = JSON.parse(localStorage.getItem('tempTestContext')) || { name: "Bài kiểm tra", folder: "Ngữ pháp" };
    let history = JSON.parse(localStorage.getItem('grammarHistory')) || [];
    
    const earnedScore = correctCount * 10;
    
    history.unshift({
        name: ctx.name,
        folder: ctx.folder,
        date: new Date().getTime(),
        percent: percent,
        score: `+${earnedScore}`,
        stats: { correctCount, wrongCount, unansweredCount, total }, 
        questions: currentTestQuestions, 
        userAnswers: userAnswers 
    });
    
    if (history.length > 50) history.length = 50; 
    localStorage.setItem('grammarHistory', JSON.stringify(history));

    const rightPanel = document.getElementById('right-panel');
    if (rightPanel) rightPanel.style.display = 'none';
    document.getElementById('submit-test-btn').style.display = 'none';
    document.getElementById('test-progress').style.display = 'none';
    document.getElementById('result-container').style.display = 'block';

    document.getElementById('res-score').innerText = `${correctCount}/${total}`;
    document.getElementById('res-text').innerText = `Bạn đã trả lời đúng ${correctCount} câu trong tổng số ${total} câu hỏi (${percent}%)`;
    
    document.getElementById('stat-correct').innerText = `Đúng: ${correctCount}`;
    document.getElementById('stat-incorrect').innerText = `Sai: ${wrongCount}`;
    document.getElementById('stat-unanswered').innerText = `Trống: ${unansweredCount}`;
    document.getElementById('filter-container').classList.remove('hidden'); 

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filterQuestions(type) {
    document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
    const filterBtn = document.getElementById(`filter-${type}`);
    if (filterBtn) filterBtn.classList.add('active');

    const cards = document.querySelectorAll('.question-card');
    cards.forEach(card => {
        if (type === 'all' || card.getAttribute('data-status') === type) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}
function reviewHistory(historyId) {
    const history = JSON.parse(localStorage.getItem('grammarHistory')) || [];
    const record = history.find(h => h.date == historyId);
    if (!record) return alert("Không tìm thấy dữ liệu bài làm!");

    if (!record.questions || !record.stats) {
        return alert("Đây là bài làm cũ trước khi cập nhật hệ thống, không thể xem lại chi tiết!");
    }

    localStorage.setItem('tempTest', JSON.stringify(record.questions));
    localStorage.setItem('tempTestContext', JSON.stringify({ name: record.name, folder: record.folder }));
    localStorage.setItem('tempReviewAnswers', JSON.stringify(record.userAnswers));
    localStorage.setItem('tempReviewStats', JSON.stringify(record.stats));
    localStorage.setItem('isReviewMode', 'true'); 
    localStorage.setItem('sourcePage', 'history'); // Chắc chắn là từ trang lịch sử
    window.location.href = 'grammar-test.html';
}

function applyReviewState() {
    const stats = JSON.parse(localStorage.getItem('tempReviewStats'));
    const total = currentTestQuestions.length;

    currentTestQuestions.forEach((q, qIndex) => {
        const userAns = userAnswers[qIndex];
        const qCard = document.getElementById(`q-card-${qIndex}`);
        const qNum = document.getElementById(`q-num-${qIndex}`); 
        
        const buttons = qCard.querySelectorAll('.option-btn');
        buttons.forEach(btn => btn.disabled = true); 

        const correctIdx = q.options.findIndex(o => o.isCorrect);

        if (userAns === undefined) {
            document.getElementById(`opt-${qIndex}-${correctIdx}`).classList.add('is-correct'); 
            if (qNum) qNum.style.background = '#64748b'; 
        } else {
            const isCorrect = q.options[userAns].isCorrect;
            if (isCorrect) {
                document.getElementById(`opt-${qIndex}-${userAns}`).classList.add('is-correct');
                qCard.querySelector('.q-text').innerHTML += ` <span class="text-green-600 ml-2">✔</span>`;
            } else {
                document.getElementById(`opt-${qIndex}-${userAns}`).classList.add('is-wrong'); 
                document.getElementById(`opt-${qIndex}-${correctIdx}`).classList.add('is-correct'); 
                qCard.querySelector('.q-text').innerHTML += ` <span class="text-red-500 ml-2">✘</span>`;
                if (qNum) qNum.style.background = '#ef4444'; 
            }
        }
        
        const expBox = document.getElementById(`exp-${qIndex}`);
        if (expBox) expBox.classList.remove('hidden');
        document.getElementById('main-content-wrapper').style.display = 'block';
    });

    document.getElementById('submit-test-btn').style.display = 'none';
    document.getElementById('test-progress').style.display = 'none';
    document.getElementById('result-container').style.display = 'block';
    const rightPanel = document.getElementById('right-panel');  
    if (rightPanel) rightPanel.style.display = 'none';
    document.getElementById('res-score').innerText = `${stats.correctCount}/${stats.total}`;
    const percent = Math.round((stats.correctCount / stats.total) * 100);
    document.getElementById('res-text').innerText = `Bạn đã trả lời đúng ${stats.correctCount} câu trong tổng số ${stats.total} câu hỏi (${percent}%)`;
    document.getElementById('stat-correct').innerText = `Đúng: ${stats.correctCount}`;
    document.getElementById('stat-incorrect').innerText = `Sai: ${stats.wrongCount}`;
    document.getElementById('stat-unanswered').innerText = `Trống: ${stats.unansweredCount}`;
    document.getElementById('filter-container').classList.remove('hidden');
    localStorage.removeItem('isReviewMode'); 
}
window.onload = function() {
    if (window.location.pathname.includes('grammar-test.html')) {
        const testData = JSON.parse(localStorage.getItem('tempTest'));
        if (testData) {
            console.log("Đã tìm thấy bài thi, bắt đầu render...");
            renderTestQuestions(); // Sửa lại tên hàm cho đúng với hàm ở phía trên
            updateProgress();
        } else {
            console.error("Không tìm thấy dữ liệu bài thi!");
        }
    }
};
function handleExit() {
    // 1. Xác định trang nguồn để quay về
    const source = localStorage.getItem('sourcePage');
    
    // 2. Dọn dẹp các dữ liệu tạm của bài thi
    localStorage.removeItem('tempTest');
    localStorage.removeItem('tempTestContext');
    localStorage.removeItem('tempReviewAnswers');
    localStorage.removeItem('tempReviewStats');
    localStorage.removeItem('isReviewMode');
    localStorage.removeItem('sourcePage'); // Xóa nguồn sau khi đọc xong
    
    // 3. Điều hướng
    if (source === 'history') {
        window.location.href = 'grammar-history.html';
    } else {
        window.location.href = 'grammar.html';
    }
}
// ==========================================
// 8. XÓA VÀ DI CHUYỂN DỮ LIỆU
// ==========================================
function deleteFolder() {
    if (!confirm("Bạn có chắc chắn muốn xóa thư mục này? LƯU Ý: TẤT CẢ THƯ MỤC CON VÀ ĐỀ THI BÊN TRONG CŨNG SẼ BỊ XÓA!")) return;
    
    const idsToDelete = getAllFolderIds(currentFolderId).map(id => String(id));
    const currentF = folders.find(f => f.id == currentFolderId);
    const parentId = currentF ? currentF.parentId : null;
    
    folders = folders.filter(f => !idsToDelete.includes(String(f.id)));
    quizzes = quizzes.filter(q => !idsToDelete.includes(String(q.folderId)));
    
    localStorage.setItem('folders', JSON.stringify(folders));
    localStorage.setItem('quizzes', JSON.stringify(quizzes));
    updateFolderSelect();

    if (parentId && folders.find(f => f.id == parentId)) {
        openFolder(parentId);
    } else {
        goHome();
    }
}

function deleteQuiz() {
    if (!confirm("Bạn có chắc chắn muốn xóa đề thi này?")) return;
    quizzes = quizzes.filter(q => String(q.id) !== String(currentQuizId));
    localStorage.setItem('quizzes', JSON.stringify(quizzes));
    goBackToFolder();
    renderQuizzes(); 
}

function openMoveQuizModal() {
    const select = document.getElementById('move-quiz-folder-select');
    if (!select) return;
    select.innerHTML = '';
    let hasOtherFolders = false;

    folders.forEach(f => {
        if (f.id != currentFolderId) {
            select.innerHTML += `<option value="${f.id}">${f.name}</option>`;
            hasOtherFolders = true;
        }
    });
    
    if (!hasOtherFolders) {
        alert("Bạn chưa có thư mục nào khác để chuyển tới. Vui lòng tạo thêm thư mục!");
        return;
    }
    openModal('modal-move-quiz');
}

function moveQuiz() {
    const newFolderId = document.getElementById('move-quiz-folder-select').value;
    if (!newFolderId) return;
    
    const quizIndex = quizzes.findIndex(q => q.id === currentQuizId);
    if (quizIndex > -1) {
        quizzes[quizIndex].folderId = newFolderId;
        localStorage.setItem('quizzes', JSON.stringify(quizzes));
        alert("Đã chuyển đề sang thư mục mới thành công!");
        closeModal('modal-move-quiz');
        goBackToFolder(); 
        renderQuizzes(); 
    }
}

// ==========================================
// 9. HIỂN THỊ DỮ LIỆU & LỊCH SỬ RA TRANG CHỦ
// ==========================================
function renderHomeGrammar() {
    const list = document.getElementById('home-grammar-list');
    if (!list) return; 
    
    list.innerHTML = '';
    const rootFolders = folders.filter(f => !f.parentId);

    if (rootFolders.length === 0) {
        list.innerHTML = `
            <div class="w-full bg-white/60 border border-dashed border-blue-300 rounded-3xl p-8 text-center flex flex-col items-center justify-center">
                <i class="fa-regular fa-folder-open text-4xl text-blue-200 mb-3"></i>
                <p class="text-[#475569] font-bold mb-4">Bạn chưa tạo thư mục ngữ pháp nào.</p>
                <a href="grammar.html" class="bg-[#3b82f6] text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-blue-600 transition">Tạo thư mục đầu tiên</a>
            </div>`;
        return;
    }

    rootFolders.forEach(f => {
        const childCount = folders.filter(sub => sub.parentId == f.id).length;
        const allIds = getAllFolderIds(f.id);
        const quizCount = quizzes.filter(q => allIds.includes(String(q.folderId))).length;
        
        list.innerHTML += `
            <div class="min-w-[260px] folder-card cursor-pointer snap-start" onclick="window.location.href='grammar.html'">
                <div class="flex items-center gap-4">
                    <div class="text-[32px] text-[#ffb3c6]">
                        <i class="fa-solid fa-folder"></i>
                    </div>
                    <div>
                        <h4 class="font-extrabold text-[#2d3748] text-lg leading-tight">${f.name}</h4>
                    </div>
                </div>
                <div class="mt-5 flex gap-2">
                    <span class="folder-tag">${childCount} thư mục con</span>
                    <span class="folder-tag">${quizCount} đề thi</span>
                </div>
            </div>`;
    });
}
function renderHistory() {
    const list = document.getElementById('history-list');
    if (!list) return;
    
    let history = JSON.parse(localStorage.getItem('grammarHistory')) || [];
    list.innerHTML = '';
    
    const isHomePage = document.getElementById('home-grammar-list') !== null;
    if (isHomePage) {
        history = history.slice(0, 5);
    }
    
    if (history.length === 0) {
        list.innerHTML = `
            <div class="text-center py-8 opacity-60">
                <i class="fa-regular fa-face-frown-open text-4xl text-gray-400 mb-3"></i>
                <p class="text-gray-500 font-bold">Bạn chưa có lịch sử làm bài nào.</p>
            </div>`;
        return;
    }

    history.forEach(item => {
        const dateObj = new Date(item.date);
        const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()} • ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
        
        list.innerHTML += `
            <div onclick="reviewHistory(${item.date})" class="bg-[#f8fafc] border border-[#e2e8f0] rounded-[24px] p-3 pr-6 flex items-center gap-4 hover:border-[#ffe4e6] hover:bg-white transition-all shadow-sm cursor-pointer">
                <div class="w-[42px] h-[42px] rounded-full bg-[#ffe4e6] flex items-center justify-center text-[#800020] text-lg shrink-0 border border-[#fbc3cb]">
                    <i class="fa-solid fa-clipboard-check"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-[#2d3748] font-extrabold text-[15px] truncate leading-tight mb-0.5">${item.name}</h4>
                    <p class="text-[#64748b] text-[11px] font-bold truncate">${dateStr} • Thư mục: ${item.folder}</p>
                </div>
                <div class="text-right flex items-center gap-4 md:gap-8">
                    <div class="hidden sm:block text-right">
                        <div class="text-[#94a3b8] text-[10px] font-extrabold uppercase mb-1 tracking-wider">Độ chính xác</div>
                        <div class="bg-[#dcfce7] text-[#166534] text-xs font-bold px-2.5 py-1 rounded-md inline-block shadow-sm">${item.percent}%</div>
                    </div>
                    <div class="text-right">
                        <div class="text-[#94a3b8] text-[10px] font-extrabold uppercase mb-1 tracking-wider">Điểm</div>
                        <div class="text-[#ea580c] font-extrabold text-lg leading-none">${item.score}</div>
                    </div>
                </div>
            </div>
        `;
    });
}
// ==========================================
// 10. CHỈNH SỬA TÊN THƯ MỤC / ĐỀ THI
// ==========================================

function openEditFolderModal() {
    if (!currentFolderId) return;
    const folder = folders.find(f => f.id == currentFolderId);
    if (!folder) return;
    
    document.getElementById('edit-folder-name').value = folder.name;
    document.getElementById('edit-folder-desc').value = folder.desc || '';
    openModal('modal-edit-folder');
}

function saveEditFolder() {
    const newName = document.getElementById('edit-folder-name').value.trim();
    const newDesc = document.getElementById('edit-folder-desc').value.trim();
    
    if (!newName) return alert("Vui lòng nhập tên thư mục!");

    const folderIndex = folders.findIndex(f => f.id == currentFolderId);
    if (folderIndex > -1) {
        const isDuplicate = folders.some(f => 
            f.parentId == folders[folderIndex].parentId && 
            f.name.toLowerCase() === newName.toLowerCase() && 
            f.id != currentFolderId
        );
        
        if (isDuplicate) return alert("Tên thư mục đã tồn tại ở cấp này!");

        folders[folderIndex].name = newName;
        folders[folderIndex].desc = newDesc;
        localStorage.setItem('folders', JSON.stringify(folders));

        document.getElementById('current-folder-name').innerText = '📁 ' + newName;
        updateFolderSelect(); 
        
        closeModal('modal-edit-folder');
    }
}

function openEditQuizModal() {
    if (!currentQuizId) return;
    const quiz = quizzes.find(q => q.id == currentQuizId);
    if (!quiz) return;

    document.getElementById('edit-quiz-name').value = quiz.name;
    openModal('modal-edit-quiz');
}

function saveEditQuiz() {
    const newName = document.getElementById('edit-quiz-name').value.trim();
    
    if (!newName) return alert("Vui lòng nhập tên đề thi!");

    const quizIndex = quizzes.findIndex(q => q.id == currentQuizId);
    if (quizIndex > -1) {
        const currentFolderIdOfQuiz = quizzes[quizIndex].folderId;
        
        const isDuplicate = quizzes.some(q => 
            q.folderId == currentFolderIdOfQuiz && 
            q.name.toLowerCase() === newName.toLowerCase() && 
            q.id != currentQuizId
        );
        
        if (isDuplicate) return alert("Tên đề thi đã tồn tại trong thư mục này!");

        quizzes[quizIndex].name = newName;
        localStorage.setItem('quizzes', JSON.stringify(quizzes));

        document.getElementById('current-quiz-name').innerText = '📄 ' + newName;
        renderQuizzes(); 
        
        closeModal('modal-edit-quiz');
    }
}

function editFolderFromList(event, folderId) {
    event.stopPropagation(); 
    currentFolderId = folderId; 
    openEditFolderModal();
}
// ==========================================
// 11. QUẢN LÝ BỘ TỪ VỰNG (THIẾT KẾ MỚI)
// ==========================================

let vocabFolders = JSON.parse(localStorage.getItem('vocabFolders')) || [];
let vocabSets = JSON.parse(localStorage.getItem('vocabSets')) || [];
let currentVocabFolderId = null;

// Khởi tạo select thư mục
function updateVocabSelects() {
    const parentSelect = document.getElementById('vocab-folder-parent');
    const setSelect = document.getElementById('vocab-set-folder');
    let optionsHTML = '';
    vocabFolders.forEach(f => { optionsHTML += `<option value="${f.id}">${f.name}</option>`; });
    if (parentSelect) parentSelect.innerHTML = '<option value="">-- Đặt làm Thư mục gốc --</option>' + optionsHTML;
    if (setSelect) setSelect.innerHTML = '<option value="">-- Chọn thư mục lưu --</option>' + optionsHTML;
}

function getAllVocabFolderIds(folderId) {
    let ids = [String(folderId)];
    let children = vocabFolders.filter(f => f.parentId == folderId).map(f => String(f.id));
    children.forEach(childId => { ids = ids.concat(getAllVocabFolderIds(childId)); });
    return ids;
}

// Điều hướng
function goVocabHome() {
    document.getElementById('vocab-view-folder').style.display = 'none';
    document.getElementById('vocab-view-home').style.display = 'block';
    currentVocabFolderId = null;
    renderVocabFolders();
}
function openVocabFolder(folderId) {
    currentVocabFolderId = folderId;
    document.getElementById('vocab-view-home').style.display = 'none';
    document.getElementById('vocab-view-folder').style.display = 'block';
    const folder = vocabFolders.find(f => f.id == folderId);
    document.getElementById('current-vocab-folder-name').innerText = '📁 ' + folder.name;
    const backBtn = document.getElementById('vocab-folder-back-btn');
    if (folder.parentId) { backBtn.innerText = '← Quay lại Thư mục mẹ'; backBtn.onclick = () => openVocabFolder(folder.parentId); } 
    else { backBtn.innerText = '← Quay lại Trang chủ'; backBtn.onclick = goVocabHome; }
    renderVocabItems();
}

// Render Thư mục từ vựng ngoài trang chủ (Hình 1)
function renderVocabFolders() {
    const list = document.getElementById('vocab-folder-list');
    if (!list) return;
    list.innerHTML = '';
    const rootFolders = vocabFolders.filter(f => !f.parentId);
    if (rootFolders.length === 0) { list.innerHTML = '<p class="text-gray-500 text-sm">Chưa có dữ liệu nào.</p>'; return; }

    rootFolders.forEach(f => {
        const childCount = vocabFolders.filter(sub => sub.parentId == f.id).length;
        const allIds = getAllVocabFolderIds(f.id);
        const setCount = vocabSets.filter(s => allIds.includes(String(s.folderId))).length;
        
        list.innerHTML += `
        <div class="bg-white border-2 border-[#ffe4e6] rounded-[24px] p-5 cursor-pointer hover:-translate-y-1 transition-transform shadow-sm flex flex-col justify-between relative group h-40" onclick="openVocabFolder(${f.id})">
            
            <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition z-10">
                <button onclick="editVocabFolderFromList(event, ${f.id})" class="w-8 h-8 rounded-full bg-[#f0f7ff] text-[#94a3b8] hover:text-[#3b82f6] hover:bg-[#dbeafe] flex items-center justify-center shadow-sm">
                    <i class="fa-solid fa-pen text-sm"></i>
                </button>
                <button onclick="deleteVocabFolderFromList(event, ${f.id})" class="w-8 h-8 rounded-full bg-[#fff0f0] text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#ffe4e6] flex items-center justify-center shadow-sm">
                    <i class="fa-solid fa-trash-can text-sm"></i>
                </button>
            </div>

            <h4 class="font-extrabold text-[#2d3748] text-[17px] flex items-center gap-2"><i class="fa-solid fa-folder text-yellow-400 text-xl"></i> ${f.name}</h4>
            <div class="mt-auto flex gap-2">
                <span class="bg-blue-50 text-blue-600 text-[11px] font-bold px-3 py-1.5 rounded-[10px]">${childCount} thư mục con</span>
                <span class="bg-red-50 text-red-600 text-[11px] font-bold px-3 py-1.5 rounded-[10px]">${setCount} bộ từ</span>
            </div>
        </div>`;
    });
}

// Render bên trong thư mục (Thư mục con + Bộ từ)
function renderVocabItems() {
    const list = document.getElementById('vocab-item-list');
    if (!list) return;
    list.innerHTML = '';
    const subFolders = vocabFolders.filter(f => f.parentId == currentVocabFolderId);
    const folderSets = vocabSets.filter(s => s.folderId == currentVocabFolderId);
    
    if (subFolders.length === 0 && folderSets.length === 0) { list.innerHTML = '<p class="text-gray-500 text-sm">Thư mục trống.</p>'; return; }

    // Hiển thị Thư mục con
    subFolders.forEach(f => {
        const childCount = vocabFolders.filter(sub => sub.parentId == f.id).length;
        const allIds = getAllVocabFolderIds(f.id);
        const setCount = vocabSets.filter(s => allIds.includes(String(s.folderId))).length;
        list.innerHTML += `
        <div class="bg-white border-2 border-[#ffe4e6] rounded-[24px] p-5 cursor-pointer hover:-translate-y-1 transition-transform shadow-sm flex flex-col justify-between relative group h-40" onclick="openVocabFolder(${f.id})">
            
            <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition z-10">
                <button onclick="editVocabFolderFromList(event, ${f.id})" class="w-8 h-8 rounded-full bg-[#f0f7ff] text-[#94a3b8] hover:text-[#3b82f6] hover:bg-[#dbeafe] flex items-center justify-center shadow-sm">
                    <i class="fa-solid fa-pen text-sm"></i>
                </button>
                <button onclick="deleteVocabFolderFromList(event, ${f.id})" class="w-8 h-8 rounded-full bg-[#fff0f0] text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#ffe4e6] flex items-center justify-center shadow-sm">
                    <i class="fa-solid fa-trash-can text-sm"></i>
                </button>
            </div>

            <h4 class="font-extrabold text-[#2d3748] text-[17px] flex items-center gap-2"><i class="fa-solid fa-folder text-yellow-400 text-xl"></i> ${f.name}</h4>
            <div class="mt-auto flex gap-2">
                <span class="bg-blue-50 text-blue-600 text-[11px] font-bold px-3 py-1.5 rounded-[10px]">${childCount} thư mục con</span>
                <span class="bg-red-50 text-red-600 text-[11px] font-bold px-3 py-1.5 rounded-[10px]">${setCount} bộ từ</span>
            </div>
        </div>`;
    });

    // Render thẻ Bộ từ (Giữ nguyên vì đã có sẵn nút Sửa/Xóa ở góc dưới thẻ)
    folderSets.forEach(s => {
        const wordCount = s.words ? s.words.length : 0;
        list.innerHTML += `
        <div class="bg-white rounded-[24px] p-5 border border-gray-200 shadow-sm relative group hover:shadow-md transition-shadow flex flex-col h-48">
            <div class="absolute top-4 right-4 w-[22px] h-[22px] rounded-full border-2 border-gray-300 cursor-pointer hover:border-blue-500 bg-white"></div>
            
            <div class="flex items-center gap-3 mb-2 pr-6">
                <span class="text-xl">✏️</span>
                <h3 class="font-extrabold text-gray-800 text-[15px] leading-tight">${s.name}</h3>
            </div>
            
            <p class="text-[12px] text-gray-400 font-bold mb-4 line-clamp-2">${s.desc || 'Chưa có mô tả'}</p>
            
            <div class="flex items-center gap-2 text-[12px] text-gray-400 font-bold mb-5 mt-auto">
                <i class="fa-solid fa-list-ul"></i> ${wordCount} từ
            </div>
            
            <div class="flex items-center gap-2 border-t border-gray-100 pt-3">
                <button onclick="window.location.href='vocab.html'" class="bg-[#3b82f6] hover:bg-blue-600 text-white px-6 py-1.5 rounded-full font-bold text-[13px] shadow-sm transition-all">Xem</button>
                <div class="flex-1"></div>
                <button class="text-gray-400 hover:text-gray-600 transition-colors"><i class="fa-solid fa-play"></i></button>
                <button onclick="editVocabSetFromList(event, ${s.id})" class="text-gray-400 hover:text-blue-500 transition-colors ml-2"><i class="fa-regular fa-pen-to-square"></i></button>
                <button onclick="deleteVocabSet(event, ${s.id})" class="text-gray-400 hover:text-red-500 transition-colors ml-2"><i class="fa-regular fa-trash-can"></i></button>
            </div>
        </div>`;
    });
}

// Logic Modal Thư mục
function openCreateVocabFolderModal() {
    document.getElementById('vocab-folder-id').value = '';
    document.getElementById('vocab-folder-name').value = '';
    document.getElementById('vocab-folder-desc').value = '';
    document.getElementById('modal-vocab-folder-title').innerText = "Tạo Thư mục Từ vựng";
    const parentSelect = document.getElementById('vocab-folder-parent');
    if (currentVocabFolderId && document.getElementById('vocab-view-folder').style.display === 'block') parentSelect.value = currentVocabFolderId; else parentSelect.value = "";
    openModal('modal-vocab-folder');
}

function editVocabFolderFromList(event, id) {
    event.stopPropagation();
    const folder = vocabFolders.find(f => f.id == id);
    if (!folder) return;
    document.getElementById('vocab-folder-id').value = folder.id;
    document.getElementById('vocab-folder-name').value = folder.name;
    document.getElementById('vocab-folder-desc').value = folder.desc || '';
    document.getElementById('vocab-folder-parent').value = folder.parentId || '';
    document.getElementById('modal-vocab-folder-title').innerText = "Chỉnh sửa Thư mục";
    openModal('modal-vocab-folder');
}

function saveVocabFolder() {
    const id = document.getElementById('vocab-folder-id').value;
    const name = document.getElementById('vocab-folder-name').value.trim();
    const desc = document.getElementById('vocab-folder-desc').value.trim();
    const parentId = document.getElementById('vocab-folder-parent').value || null;
    if (!name) return alert("Vui lòng nhập tên thư mục!");
    
    const isDuplicate = vocabFolders.some(f => f.parentId == parentId && f.name.toLowerCase() === name.toLowerCase() && f.id != id);
    if (isDuplicate) return alert("Tên thư mục đã tồn tại ở cấp này!");
    
    if (id) {
        const index = vocabFolders.findIndex(f => f.id == id);
        if (index > -1) { vocabFolders[index].name = name; vocabFolders[index].desc = desc; vocabFolders[index].parentId = parentId; }
    } else {
        vocabFolders.push({ id: Date.now(), name, desc, parentId });
    }
    
    localStorage.setItem('vocabFolders', JSON.stringify(vocabFolders));
    closeModal('modal-vocab-folder');
    updateVocabSelects();
    
    if (currentVocabFolderId && document.getElementById('vocab-view-folder').style.display === 'block') {
        if (id == currentVocabFolderId) document.getElementById('current-vocab-folder-name').innerText = '📁 ' + name;
        renderVocabItems();
    } else { renderVocabFolders(); }
}

function deleteVocabFolder() {
    if (!confirm("Xóa thư mục này sẽ XÓA TOÀN BỘ thư mục con và bộ từ bên trong. Bạn chắc chắn chứ?")) return;
    const idsToDelete = getAllVocabFolderIds(currentVocabFolderId).map(id => String(id));
    const currentF = vocabFolders.find(f => f.id == currentVocabFolderId);
    const parentId = currentF ? currentF.parentId : null;
    vocabFolders = vocabFolders.filter(f => !idsToDelete.includes(String(f.id)));
    vocabSets = vocabSets.filter(s => !idsToDelete.includes(String(s.folderId)));
    localStorage.setItem('vocabFolders', JSON.stringify(vocabFolders));
    localStorage.setItem('vocabSets', JSON.stringify(vocabSets));
    updateVocabSelects();
    if (parentId && vocabFolders.find(f => f.id == parentId)) openVocabFolder(parentId); else goVocabHome();
}

// Logic Modal Bộ từ
function openCreateVocabSetModal() {
    document.getElementById('vocab-set-id').value = '';
    document.getElementById('vocab-set-name').value = '';
    document.getElementById('vocab-set-desc').value = '';
    document.getElementById('modal-vocab-set-title').innerText = "Tạo Bộ Từ Vựng";
    const setSelect = document.getElementById('vocab-set-folder');
    if (currentVocabFolderId && document.getElementById('vocab-view-folder').style.display === 'block') setSelect.value = currentVocabFolderId; else setSelect.value = "";
    openModal('modal-vocab-set');
}

function editVocabSetFromList(event, id) {
    event.stopPropagation();
    const set = vocabSets.find(s => s.id == id);
    if (!set) return;
    document.getElementById('vocab-set-id').value = set.id;
    document.getElementById('vocab-set-name').value = set.name;
    document.getElementById('vocab-set-desc').value = set.desc || '';
    document.getElementById('vocab-set-folder').value = set.folderId;
    document.getElementById('modal-vocab-set-title').innerText = "Chỉnh sửa Bộ Từ";
    openModal('modal-vocab-set');
}

function saveVocabSet() {
    const id = document.getElementById('vocab-set-id').value;
    const name = document.getElementById('vocab-set-name').value.trim();
    const desc = document.getElementById('vocab-set-desc').value.trim();
    const folderId = document.getElementById('vocab-set-folder').value;
    if (!name || !folderId) return alert("Vui lòng nhập Tên và chọn Thư mục lưu!");
    
    const isDuplicate = vocabSets.some(s => s.folderId == folderId && s.name.toLowerCase() === name.toLowerCase() && s.id != id);
    if (isDuplicate) return alert("Tên Bộ từ đã tồn tại trong thư mục này!");

    if (id) {
        const index = vocabSets.findIndex(s => s.id == id);
        if (index > -1) { vocabSets[index].name = name; vocabSets[index].desc = desc; vocabSets[index].folderId = folderId; }
    } else {
        vocabSets.push({ id: Date.now(), folderId, name, desc, words: [] });
    }

    localStorage.setItem('vocabSets', JSON.stringify(vocabSets));
    closeModal('modal-vocab-set');
    
    if (currentVocabFolderId == folderId && document.getElementById('vocab-view-folder').style.display === 'block') renderVocabItems(); 
    else if (currentVocabFolderId == null) renderVocabFolders(); 
}

function deleteVocabSet(event, setId) {
    event.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa bộ từ này không?")) return;
    vocabSets = vocabSets.filter(s => String(s.id) !== String(setId));
    localStorage.setItem('vocabSets', JSON.stringify(vocabSets));
    renderVocabItems(); 
}
// Cập nhật lại số thứ tự của các thẻ
function updateCardNumbers() {
    const cards = document.querySelectorAll('.vocab-card-item');
    cards.forEach((card, index) => {
        const numberLabel = card.querySelector('.card-number-label');
        if (numberLabel) numberLabel.innerText = index + 1;
    });
}

// Xoá thẻ và cập nhật lại số
function deleteVocabCard(btn) {
    btn.closest('.vocab-card-item').remove();
    updateCardNumbers();
}

// Mở cửa sổ Tạo bộ từ nâng cao
function openAdvancedCreateVocabSet() {
    document.getElementById('adv-vocab-title').value = '';
    document.getElementById('adv-vocab-desc').value = '';
    
    // Đặt ID thư mục hiện tại
    if (currentVocabFolderId && document.getElementById('vocab-view-folder').style.display === 'block') {
        document.getElementById('adv-vocab-folder-id').value = currentVocabFolderId;
    } else {
        document.getElementById('adv-vocab-folder-id').value = '';
    }

    // Reset danh sách thẻ và tạo sẵn 2 thẻ trống
    document.getElementById('vocab-cards-container').innerHTML = '';
    addVocabCard();
    addVocabCard();

    // Hiển thị giao diện
    const modal = document.getElementById('advanced-modal-vocab-set');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
}

// Đóng cửa sổ
function closeAdvancedCreateVocabSet() {
    const modal = document.getElementById('advanced-modal-vocab-set');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto'; 
}

// Thêm một thẻ từ vựng mới
function addVocabCard() {
    const container = document.getElementById('vocab-cards-container');
    
    const cardHTML = `
        <div class="bg-white/90 p-6 rounded-[24px] shadow-sm border border-[#e2e8f0] relative group transition-all hover:border-[#ffe4e6] vocab-card-item">
            <div class="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                <span class="font-extrabold text-xl text-[#2d3748] card-number-label"></span>
                <div class="flex gap-2">
                    <button class="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition flex items-center justify-center"><i class="fa-solid fa-image"></i></button>
                    <button class="w-8 h-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition flex items-center justify-center" onclick="deleteVocabCard(this)"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                    <label class="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Thuật ngữ</label>
                    <input type="text" placeholder="Nhập thuật ngữ" class="card-term w-full p-2 border-b-2 border-gray-200 outline-none focus:border-[#3b82f6] bg-transparent font-bold text-gray-800 transition">
                </div>
                <div>
                    <label class="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Định nghĩa</label>
                    <input type="text" placeholder="Nhập định nghĩa" class="card-def w-full p-2 border-b-2 border-gray-200 outline-none focus:border-[#ffb3c6] bg-transparent font-bold text-gray-800 transition">
                </div>
                <div>
                    <label class="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Phát âm (Tùy chọn)</label>
                    <input type="text" placeholder="VD: /həˈloʊ/" class="card-pron w-full p-2 border-b-2 border-gray-200 outline-none focus:border-[#3b82f6] bg-transparent text-sm transition">
                </div>
                <div>
                    <label class="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Loại từ (Tùy chọn)</label>
                    <input type="text" placeholder="VD: noun, verb..." class="card-type w-full p-2 border-b-2 border-gray-200 outline-none focus:border-[#ffb3c6] bg-transparent text-sm transition">
                </div>
                <div>
                    <label class="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Ví dụ (Tùy chọn)</label>
                    <input type="text" placeholder="Nhập câu ví dụ" class="card-ex w-full p-2 border-b-2 border-gray-200 outline-none focus:border-[#3b82f6] bg-transparent text-sm transition">
                </div>
                <div>
                    <label class="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Từ đồng nghĩa (Tùy chọn)</label>
                    <input type="text" placeholder="Các từ cách nhau bằng dấu phẩy (,)" class="card-syn w-full p-2 border-b-2 border-gray-200 outline-none focus:border-[#ffb3c6] bg-transparent text-sm transition">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', cardHTML);
    updateCardNumbers(); // Tự động đánh số lại ngay khi thêm thẻ
}

// Lưu bộ từ từ giao diện nâng cao
function saveAdvancedVocabSet() {
    const title = document.getElementById('adv-vocab-title').value.trim();
    const desc = document.getElementById('adv-vocab-desc').value.trim();
    const folderId = document.getElementById('adv-vocab-folder-id').value;

    if (!title) return alert("Vui lòng nhập tiêu đề cho bộ từ!");
    if (!folderId) return alert("Không xác định được thư mục lưu. Vui lòng mở từ bên trong một thư mục!");

    // Trích xuất dữ liệu từ các thẻ
    const wordList = [];
    const cardElements = document.querySelectorAll('.vocab-card-item');
    
    cardElements.forEach(card => {
        const term = card.querySelector('.card-term').value.trim();
        const def = card.querySelector('.card-def').value.trim();
        const pron = card.querySelector('.card-pron').value.trim();
        const type = card.querySelector('.card-type').value.trim();
        const ex = card.querySelector('.card-ex').value.trim();
        const syn = card.querySelector('.card-syn').value.trim();

        // Chỉ lưu thẻ nếu có nhập ít nhất thuật ngữ hoặc định nghĩa
        if (term || def) {
            wordList.push({
                id: Date.now() + Math.random(),
                term, definition: def, pronunciation: pron, wordType: type, example: ex, synonyms: syn
            });
        }
    });

    if (wordList.length === 0) return alert("Vui lòng nhập ít nhất một thuật ngữ!");

    // Lưu vào LocalStorage
    vocabSets.push({
        id: Date.now(),
        folderId: folderId,
        name: title,
        desc: desc,
        words: wordList
    });

    localStorage.setItem('vocabSets', JSON.stringify(vocabSets));
    
    // Cập nhật giao diện thư mục
    renderVocabItems();
    closeAdvancedCreateVocabSet();
}
// ==========================================
// HÀM HỖ TRỢ XOÁ TRỰC TIẾP TỪ DANH SÁCH (DÙNG CHO CẢ GRAMMAR & VOCAB)
// ==========================================

// Xoá thư mục Grammar trực tiếp
function deleteFolderFromList(event, folderId) {
    event.stopPropagation(); // Chặn sự kiện click vào thẻ cha mở thư mục
    if (!confirm("Bạn có chắc chắn muốn xóa thư mục này? LƯU Ý: TẤT CẢ THƯ MỤC CON VÀ ĐỀ THI BÊN TRONG CŨNG SẼ BỊ XÓA!")) return;
    
    const idsToDelete = getAllFolderIds(folderId).map(id => String(id));
    
    folders = folders.filter(f => !idsToDelete.includes(String(f.id)));
    quizzes = quizzes.filter(q => !idsToDelete.includes(String(q.folderId)));
    
    localStorage.setItem('folders', JSON.stringify(folders));
    localStorage.setItem('quizzes', JSON.stringify(quizzes));
    updateFolderSelect();

    // Render lại màn hình hiện tại
    if (currentFolderId && document.getElementById('view-folder') && document.getElementById('view-folder').style.display === 'block') {
        renderQuizzes();
    } else {
        renderFolders();
    }
}

// Xoá đề thi Grammar trực tiếp
function deleteQuizFromList(event, quizId) {
    event.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa đề thi này?")) return;
    
    quizzes = quizzes.filter(q => String(q.id) !== String(quizId));
    localStorage.setItem('quizzes', JSON.stringify(quizzes));
    
    renderQuizzes(); 
}

// Xoá thư mục Từ vựng trực tiếp
function deleteVocabFolderFromList(event, folderId) {
    event.stopPropagation();
    if (!confirm("Xóa thư mục này sẽ XÓA TOÀN BỘ thư mục con và bộ từ bên trong. Bạn chắc chắn chứ?")) return;
    
    const idsToDelete = getAllVocabFolderIds(folderId).map(id => String(id));
    
    vocabFolders = vocabFolders.filter(f => !idsToDelete.includes(String(f.id)));
    vocabSets = vocabSets.filter(s => !idsToDelete.includes(String(s.folderId)));
    
    localStorage.setItem('vocabFolders', JSON.stringify(vocabFolders));
    localStorage.setItem('vocabSets', JSON.stringify(vocabSets));
    updateVocabSelects();
    
    if (currentVocabFolderId && document.getElementById('vocab-view-folder') && document.getElementById('vocab-view-folder').style.display === 'block') {
        renderVocabItems();
    } else {
        renderVocabFolders();
    }
}
// ==========================================
// 12. LOGIC NHẬP TỪ VỰNG HÀNG LOẠT
// ==========================================

function openImportVocabModal() {
    document.getElementById('import-vocab-text').value = '';
    
    // Cách an toàn để reset radio button có chứa ký tự đặc biệt (\t, \n)
    const wordSeps = document.getElementsByName('word-sep');
    for(let i = 0; i < wordSeps.length; i++) {
        if(wordSeps[i].value === '\\t') wordSeps[i].checked = true;
    }

    const cardSeps = document.getElementsByName('card-sep');
    for(let i = 0; i < cardSeps.length; i++) {
        if(cardSeps[i].value === '\\n') cardSeps[i].checked = true;
    }

    document.getElementById('custom-word-sep').classList.add('hidden');
    openModal('modal-import-vocab');
}

// Bắt sự kiện khi người dùng chọn nút "Tuỳ chọn" để hiện ô nhập ký tự
document.addEventListener('change', function(e) {
    if(e.target.name === 'word-sep') {
        const customInput = document.getElementById('custom-word-sep');
        if(e.target.value === 'custom') {
            customInput.classList.remove('hidden');
            customInput.focus();
        } else {
            customInput.classList.add('hidden');
        }
    }
});

function processImportVocab() {
    const rawText = document.getElementById('import-vocab-text').value.trim();
    if (!rawText) return alert("Vui lòng dán dữ liệu vào ô trống!");

    // Xử lý ký tự phân tách Thuật ngữ và Định nghĩa
    let wordSep = document.querySelector('input[name="word-sep"]:checked').value;
    if (wordSep === 'custom') {
        wordSep = document.getElementById('custom-word-sep').value;
        if (!wordSep) return alert("Vui lòng nhập ký tự phân cách tuỳ chọn!");
    } else if (wordSep === '\\t') {
        wordSep = '\t'; // Ký tự Tab thực tế trong string
    }

    // Xử lý ký tự phân tách các thẻ
    let cardSepValue = document.querySelector('input[name="card-sep"]:checked').value;
    const cards = cardSepValue === '\\n' ? rawText.split('\n') : rawText.split(cardSepValue);
    
    let importedCount = 0;

    cards.forEach(cardRaw => {
        if (!cardRaw.trim()) return; 
        
        // Cắt string theo ký tự và gán vào tương ứng (Hỗ trợ chép từ Excel có nhiều cột)
        const parts = cardRaw.split(wordSep);
        const term = parts[0] ? parts[0].trim() : '';
        const def = parts[1] ? parts[1].trim() : '';
        const pron = parts[2] ? parts[2].trim() : '';
        const type = parts[3] ? parts[3].trim() : '';
        const ex = parts[4] ? parts[4].trim() : '';
        const syn = parts[5] ? parts[5].trim() : '';

        if (term || def) {
            addVocabCard(); // Thêm 1 giao diện thẻ trên màn hình
            
            const allCards = document.querySelectorAll('.vocab-card-item');
            const newCard = allCards[allCards.length - 1];
            
            // Gán dữ liệu vào các ô input tương ứng
            newCard.querySelector('.card-term').value = term;
            newCard.querySelector('.card-def').value = def;
            if(pron) newCard.querySelector('.card-pron').value = pron;
            if(type) newCard.querySelector('.card-type').value = type;
            if(ex) newCard.querySelector('.card-ex').value = ex;
            if(syn) newCard.querySelector('.card-syn').value = syn;
            
            importedCount++;
        }
    });

    if (importedCount > 0) {
        // Dọn dẹp các thẻ trống ban đầu để list đẹp hơn
        const allCards = document.querySelectorAll('.vocab-card-item');
        allCards.forEach(card => {
            const t = card.querySelector('.card-term').value.trim();
            const d = card.querySelector('.card-def').value.trim();
            if (!t && !d) card.remove();
        });
        // ---> BỔ SUNG DÒNG NÀY ĐỂ SẮP XẾP LẠI SỐ SAU KHI DỌN DẸP <---
        updateCardNumbers();

        alert(`Đã nhập thành công ${importedCount} thẻ!`);
        closeModal('modal-import-vocab');
    } else {
        alert("Không tìm thấy dữ liệu hợp lệ. Vui lòng kiểm tra lại ký tự phân cách!");
    }
}
// ==========================================
// 13. LOGIC HIỂN THỊ TỔNG HỢP TỪ VỰNG (VOCAB.HTML)
// ==========================================

function renderAllVocabList() {
    const tbody = document.getElementById('all-vocab-list');
    if (!tbody) return;

    tbody.innerHTML = '';
    let allWords = [];
    
    // Gom tất cả từ vựng từ mọi bộ từ đang có trong hệ thống
    vocabSets.forEach(set => {
        if (set.words && set.words.length > 0) {
            set.words.forEach(word => {
                allWords.push({ ...word, setName: set.name });
            });
        }
    });

    if (allWords.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-24 text-center">
                    <div class="flex flex-col items-center opacity-40">
                        <i class="fa-regular fa-folder-open text-5xl mb-4"></i>
                        <p class="font-bold text-gray-500">Chưa có từ vựng nào. Hãy tạo bộ từ mới!</p>
                    </div>
                </td>
            </tr>`;
        updateVocabStats(0, 0, 0);
        return;
    }

    let totalWords = allWords.length;
    let learnedWords = 0; 
    let unlearnedWords = 0; 

    // Render danh sách
    allWords.forEach((word, index) => {
        // Mặc định từ mới thêm vào sẽ là Cấp 0
        const srsLevel = word.srsLevel || 0; 
        
        if (srsLevel > 0) learnedWords++;
        else unlearnedWords++;

        // Render giao diện Mức độ
        let levelBadge = '';
        if (srsLevel === 0) {
            levelBadge = `<span class="bg-gray-100 text-gray-500 border border-gray-200 font-bold px-3 py-1 rounded-full text-[11px] shadow-sm">Cấp 0</span>`;
        } else if (srsLevel >= 1 && srsLevel <= 4) {
            levelBadge = `<span class="bg-blue-50 text-blue-600 border border-blue-200 font-bold px-3 py-1 rounded-full text-[11px] shadow-sm">Cấp ${srsLevel}</span>`;
        } else {
            levelBadge = `<span class="bg-green-50 text-green-600 border border-green-200 font-bold px-3 py-1 rounded-full text-[11px] shadow-sm">Cấp ${srsLevel}</span>`;
        }

        // Tạo thẻ Type nếu có
        const typeBadge = word.wordType ? `<span class="bg-purple-50 border border-purple-200 text-purple-600 px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold">${word.wordType}</span>` : '-';

        tbody.innerHTML += `
            <tr class="border-b border-gray-50 hover:bg-blue-50/30 transition-colors vocab-row-item" data-level="${srsLevel}">                <td class="px-5 py-4 font-extrabold text-gray-800 text-[15px] vocab-term-text">${word.term || '-'}</td>
                <td class="px-5 py-4 font-bold text-gray-600 text-sm">${word.definition || '-'}</td>
                <td class="px-5 py-4 text-[13px] text-gray-500 font-medium">${word.pronunciation || '-'}</td>
                <td class="px-5 py-4">${typeBadge}</td>
                <td class="px-5 py-4 text-[13px] text-gray-500 italic leading-snug"><div class="line-clamp-2" title="${word.example || ''}">${word.example || '-'}</div></td>
                <td class="px-5 py-4 text-[13px] text-gray-500 font-medium">${word.synonyms || '-'}</td>
                <td class="px-5 py-4 text-center">${levelBadge}</td>
            </tr>
        `;
    });

    updateVocabStats(totalWords, learnedWords, unlearnedWords);
}

// Cập nhật số liệu lên 4 thẻ ở trên
function updateVocabStats(total, learned, unlearned) {
    document.getElementById('stat-total-vocab').innerText = total;
    document.getElementById('stat-learned-vocab').innerText = learned;
    document.getElementById('stat-unlearned-vocab').innerText = unlearned;
    
    const percent = total === 0 ? 0 : Math.round((learned / total) * 100);
    document.getElementById('stat-percent-vocab').innerText = percent + '%';
}

// Tính năng thanh tìm kiếm & Lọc theo cấp độ
function filterAllVocabList() {
    const searchText = document.getElementById('search-all-vocab').value.toLowerCase();
    const filterLevel = document.getElementById('filter-srs-level').value;
    const rows = document.querySelectorAll('.vocab-row-item');

    rows.forEach(row => {
        const term = row.querySelector('.vocab-term-text').innerText.toLowerCase();
        const levelStatus = row.getAttribute('data-level');
        
        const matchText = term.includes(searchText);
        const matchLevel = (filterLevel === 'all') || (filterLevel === levelStatus);

        if (matchText && matchLevel) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}
// ==========================================
// 14. GAME FLASHCARD LOGIC (CÓ LƯU MỨC ĐỘ VÀ THỜI GIAN SRS)
// ==========================================

// Bảng quy đổi thời gian chờ (tính bằng milliseconds)
const SRS_INTERVALS = {
    1: 1 * 60 * 60 * 1000,        // Cấp 1: 1 giờ
    2: 12 * 60 * 60 * 1000,       // Cấp 2: 12 giờ
    3: 24 * 60 * 60 * 1000,       // Cấp 3: 1 ngày
    4: 3 * 24 * 60 * 60 * 1000,   // Cấp 4: 3 ngày
    5: 7 * 24 * 60 * 60 * 1000,   // Cấp 5: 1 tuần
    6: 14 * 24 * 60 * 60 * 1000,  // Cấp 6: 2 tuần
    7: 30 * 24 * 60 * 60 * 1000,  // Cấp 7: 1 tháng (tạm tính 30 ngày)
    8: 60 * 24 * 60 * 60 * 1000   // Cấp 8: 2 tháng (tạm tính 60 ngày)
};

let fcVocab = []; 
let fcCurrentIndex = 0;
let fcIsFlipped = false;

function openFlashcardGame() {
    // Dùng chung hàm lọc để tuân thủ thiết lập UI
    const words = fetchEligibleWords(false, false);
    
    if (words.length === 0) {
        alert("Không có từ nào thỏa mãn bộ lọc hiện tại. Hãy thử thay đổi bộ lọc nhé 🌷");
        return;
    }

    fcVocab = words.map(w => ({
        setId: w.setId,
        wordId: w.wordId,
        word: w.term || 'Chưa có thuật ngữ',
        type: w.wordType || '',
        pronunciation: w.pronunciation || '',
        meaning: w.definition || 'Chưa có định nghĩa',
        example: w.example || '',
        level: w.level || 0
    }));

    const modal = document.getElementById('flashcard-game-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    fcCurrentIndex = 0;
    fcIsFlipped = false; 
    fcUpdateUI();
}

function closeFlashcardGame() {
    const modal = document.getElementById('flashcard-game-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function fcUpdateUI() {
    document.getElementById("fc-progress-text").innerText = `${fcCurrentIndex + 1} / ${fcVocab.length}`;
    
    document.getElementById("fc-en-word").innerText = fcVocab[fcCurrentIndex].word;
    document.getElementById("fc-en-type").innerText = fcVocab[fcCurrentIndex].type;
    document.getElementById("fc-en-pronunciation").innerText = fcVocab[fcCurrentIndex].pronunciation;
    
    document.getElementById("fc-vn-meaning").innerText = fcVocab[fcCurrentIndex].meaning;
    
    const exampleBox = document.getElementById("fc-example-box");
    if (fcVocab[fcCurrentIndex].example) {
        document.getElementById("fc-vn-example").innerText = `Ví dụ: "${fcVocab[fcCurrentIndex].example}"`;
        exampleBox.style.display = "flex";
    } else {
        exampleBox.style.display = "none";
    }

    const inner = document.getElementById("fc-flashcard-inner");
    if (fcIsFlipped) {
        inner.classList.remove("is-flipped");
        fcIsFlipped = false;
    }
}

function fcFlipCard() {
    fcIsFlipped = !fcIsFlipped;
    const inner = document.getElementById("fc-flashcard-inner");
    if (fcIsFlipped) {
        inner.classList.add("is-flipped");
    } else {
        inner.classList.remove("is-flipped");
    }
}

function fcNextWord() {
    // Nếu đã học hết bộ thẻ đã lọc ra thì tự động đóng và báo thành công
    if (fcCurrentIndex >= fcVocab.length - 1) {
        alert("Hoan hô! Bạn đã hoàn thành đợt ôn tập này 🎉");
        closeFlashcardGame();
        return;
    }
    fcCurrentIndex++;
    fcUpdateUI();
}

function fcPrevWord() {
    fcCurrentIndex = (fcCurrentIndex - 1 + fcVocab.length) % fcVocab.length;
    fcUpdateUI();
}

function fcResetGame() {
    fcCurrentIndex = 0;
    fcUpdateUI();
}

// Cập nhật Cấp độ và Tính toán Thời gian ôn tiếp theo
function updateWordSrsLevel(setId, wordId, newLevel) {
    const setIndex = vocabSets.findIndex(s => s.id === setId);
    if (setIndex > -1) {
        const wordIndex = vocabSets[setIndex].words.findIndex(w => w.id === wordId);
        if (wordIndex > -1) {
            let nextTime = 0;
            
            // Tính toán khoảng thời gian đẩy về tương lai
            if (newLevel > 0 && newLevel <= 8) {
                nextTime = Date.now() + SRS_INTERVALS[newLevel];
            } else if (newLevel > 8) {
                // Nếu vượt cấp 8 (thuộc nằm lòng), cứ tính mốc max là 2 tháng
                newLevel = 8;
                nextTime = Date.now() + SRS_INTERVALS[8];
            }

            vocabSets[setIndex].words[wordIndex].srsLevel = newLevel;
            vocabSets[setIndex].words[wordIndex].nextReviewTime = nextTime; // Lưu mốc thời gian tương lai
            
            localStorage.setItem('vocabSets', JSON.stringify(vocabSets));
        }
    }
}

// Xử lý khi nhấn nút "Thuộc"
function fcMarkRemembered() {
    const currentWord = fcVocab[fcCurrentIndex];
    currentWord.level += 1; // Tăng 1 cấp
    updateWordSrsLevel(currentWord.setId, currentWord.wordId, currentWord.level);
    fcNextWord();
}

// Xử lý khi nhấn nút "Quên"
function fcMarkForgotten() {
    const currentWord = fcVocab[fcCurrentIndex];
    currentWord.level = 0; // Trả về cấp 0
    updateWordSrsLevel(currentWord.setId, currentWord.wordId, currentWord.level);
    fcNextWord();
}

// Lắng nghe phím tắt cho Flashcard
document.addEventListener("keydown", function(event) {
    const modal = document.getElementById('flashcard-game-modal');
    if (modal && !modal.classList.contains('hidden')) {
        if (event.code === "Space") {
            event.preventDefault(); 
            fcFlipCard();
        } else if (event.code === "ArrowRight") {
            fcNextWord();
        } else if (event.code === "ArrowLeft") {
            fcPrevWord();
        }
    }
});
// ==========================================
// 15. CÁC CHẾ ĐỘ GAME (TRẮC NGHIỆM, NỐI TỪ, GÕ TỪ)
// ==========================================

let activeGameMode = ''; // 'quiz', 'match', 'type'
let isMixMode = false; // Biến nhận diện chế độ Tổng hợp
let gameQuestions = [];
let currentGameIndex = 0;
let gameTimer;
let timeLeft = 30;
let gameScore = 0;
let isAnswering = false;
let feedbackTimer;

// Dữ liệu dùng chung để in ra màn hình Kết Quả
let quizSessionData = {
    total: 0,
    correctWords: [],
    wrongWords: [],
    srsUpdates: [] 
};

// Mở Modal Trắc nghiệm
function openQuizModeModal() {
    document.getElementById('quiz-mode-modal').classList.remove('hidden');
    document.getElementById('quiz-mode-modal').classList.add('flex');
}
function closeQuizModeModal() {
    document.getElementById('quiz-mode-modal').classList.add('hidden');
    document.getElementById('quiz-mode-modal').classList.remove('flex');
}
// Thêm hàm này vào file script của bạn
function forceExitGame() {
    // 1. Dọn sạch toàn bộ trạng thái
    clearInterval(gameTimer);
    clearInterval(feedbackTimer);
    
    // 2. Reset biến game
    isAnswering = false;
    gameScore = 0;
    currentGameIndex = 0;
    
    // 3. Đóng tất cả modal/overlay
    document.getElementById('quiz-game-modal').classList.add('hidden');
    document.getElementById('quiz-exit-modal').style.display = 'none';
    
    // 4. Về trang game
    window.location.href = 'game.html';
}
// ==========================================
// HÀM KHỞI TẠO BỘ LỌC VÀ LẤY DỮ LIỆU GAME (CẬP NHẬT GIAO DIỆN SÁNG)
// ==========================================

function initGameFilters() {
    const listContainer = document.getElementById('folder-dropdown-list');
    if (!listContainer) return;

    let html = `
        <div class="dropdown-item flex items-center gap-2 p-2.5 rounded-lg cursor-pointer hover:bg-[#fff0f3] text-gray-700 text-sm font-semibold transition-colors" data-value="all" onclick="selectFolderFilter('all', 'Tất cả bộ từ')">
            <i class="fa-regular fa-circle w-4 text-center radio-icon text-gray-400"></i> Tất cả bộ từ
        </div>
    `;

    vocabFolders.forEach(f => {
        const sets = vocabSets.filter(s => s.folderId == f.id);
        if (sets.length > 0) {
            html += `
            <div class="folder-group">
                <div class="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer hover:bg-[#fff0f3] text-[#800020] text-sm font-bold transition-colors" onclick="toggleDropdownFolder(this)">
                    <i class="fa-solid fa-chevron-right text-[10px] w-4 text-center transition-transform duration-200 folder-icon text-gray-400"></i>
                    <i class="fa-solid fa-folder text-yellow-400"></i> <span class="folder-name">${f.name}</span>
                </div>
                <div class="folder-children hidden pl-6 flex-col gap-1 mt-1">
                    <div class="dropdown-item flex items-center gap-2 p-2.5 rounded-lg cursor-pointer hover:bg-[#fff0f3] text-gray-700 text-sm font-semibold transition-colors" data-value="folder_${f.id}" onclick="selectFolderFilter('folder_${f.id}', '[Toàn bộ thư mục này]')">
                        <i class="fa-regular fa-circle w-4 text-center radio-icon text-gray-400"></i> [Toàn bộ thư mục này]
                    </div>
            `;
            sets.forEach(s => {
                html += `
                    <div class="dropdown-item flex items-center gap-2 p-2.5 rounded-lg cursor-pointer hover:bg-[#fff0f3] text-gray-700 text-sm font-semibold transition-colors" data-value="set_${s.id}" onclick="selectFolderFilter('set_${s.id}', '${s.name}')">
                        <i class="fa-regular fa-circle w-4 text-center radio-icon text-gray-400"></i> <span class="set-name">${s.name}</span>
                    </div>
                `;
            });
            html += `</div></div>`;
        }
    });

    const rootSets = vocabSets.filter(s => !s.folderId);
    if (rootSets.length > 0) {
        html += `<div class="mt-3 mb-1 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Các bộ từ khác</div>`;
        rootSets.forEach(s => {
            html += `
                <div class="dropdown-item flex items-center gap-2 p-2.5 rounded-lg cursor-pointer hover:bg-[#fff0f3] text-gray-700 text-sm font-semibold transition-colors" data-value="set_${s.id}" onclick="selectFolderFilter('set_${s.id}', '${s.name}')">
                    <i class="fa-regular fa-circle w-4 text-center radio-icon text-gray-400"></i> <span class="set-name">${s.name}</span>
                </div>
            `;
        });
    }

    listContainer.innerHTML = html;
    updateGameReadyCount();
    highlightSelectedFilter(document.getElementById('game-filter-folder').value);
}

// ----------------------------------------------------
// LOGIC QUẢN LÝ CÁC DROPDOWN MENU
// ----------------------------------------------------

// 1. Hàm mở/đóng chung cho tất cả Dropdown
function toggleDropdown(event, menuId) {
    if(event) event.stopPropagation();
    
    // Đóng tất cả menu khác trước khi mở menu mới
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if(menu.id !== menuId) {
            menu.classList.add('hidden');
            menu.classList.remove('flex');
        }
    });

    const targetMenu = document.getElementById(menuId);
    if (targetMenu) {
        targetMenu.classList.toggle('hidden');
        targetMenu.classList.toggle('flex');
    }
}

// 2. Xử lý khi click ngoài vùng dropdown thì tự đóng
document.addEventListener('click', function(event) {
    if (!event.target.closest('.custom-dropdown-container')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.add('hidden');
            menu.classList.remove('flex');
        });
    }
});

// 3. Đóng/Mở thư mục con bên trong danh sách Bộ từ
function toggleDropdownFolder(el) {
    const children = el.nextElementSibling;
    const icon = el.querySelector('.folder-icon');
    if (children.classList.contains('hidden')) {
        children.classList.remove('hidden');
        children.classList.add('flex');
        icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
    } else {
        children.classList.add('hidden');
        children.classList.remove('flex');
        icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
    }
}

// 4. Xử lý khi chọn mục trong Menu "Bộ từ vựng"
function selectFolderFilter(value, text) {
    document.getElementById('game-filter-folder').value = value;
    document.getElementById('folder-dropdown-text').innerText = text;
    highlightSelectedFilter(value);
    
    document.getElementById('folder-dropdown-menu').classList.add('hidden');
    document.getElementById('folder-dropdown-menu').classList.remove('flex');
    updateGameReadyCount();
}

// 5. Bôi xanh mục đang được chọn (cho menu Bộ từ vựng)
function highlightSelectedFilter(value) {
    const allItems = document.querySelectorAll('#folder-dropdown-list .dropdown-item');
    allItems.forEach(item => {
        const icon = item.querySelector('.radio-icon');
        if (item.getAttribute('data-value') === value) {
            icon.classList.replace('fa-regular', 'fa-solid');
            icon.classList.replace('fa-circle', 'fa-circle-dot');
            icon.classList.replace('text-gray-400', 'text-blue-500');
            item.classList.add('bg-blue-50', 'text-blue-600');
        } else {
            icon.classList.replace('fa-solid', 'fa-regular');
            icon.classList.replace('fa-circle-dot', 'fa-circle');
            icon.classList.replace('text-blue-500', 'text-gray-400');
            item.classList.remove('bg-blue-50', 'text-blue-600');
        }
    });
}

// 6. Xử lý khi chọn mục trong các Menu còn lại (Bộ lọc, Thứ tự, Số lượng)
function selectFilterOption(type, value, text) {
    // Cập nhật giá trị ẩn và text hiển thị
    document.getElementById(`game-filter-${type}`).value = value;
    document.getElementById(`${type}-dropdown-text`).innerText = text;
    
    // Đổi màu item được chọn
    const menu = document.getElementById(`${type}-dropdown-menu`);
    const items = menu.querySelectorAll('.dropdown-item');
    items.forEach(item => {
        const icon = item.querySelector('i');
        // Kiểm tra xem item này có đang giữ value hiện tại không
        if (item.getAttribute('onclick').includes(`'${value}'`)) {
            icon.className = 'fa-solid fa-circle-dot w-4 text-center text-blue-500';
            item.classList.add('bg-blue-50', 'text-blue-600');
            item.classList.remove('text-gray-700');
        } else {
            icon.className = 'fa-regular fa-circle w-4 text-center text-gray-300';
            item.classList.remove('bg-blue-50', 'text-blue-600');
            item.classList.add('text-gray-700');
        }
    });

    // Đóng menu và render lại số lượng từ sẵn sàng
    menu.classList.add('hidden');
    menu.classList.remove('flex');
    updateGameReadyCount();
}

// 7. Thanh tìm kiếm của thư mục
function filterDropdownFolders() {
    const searchText = document.getElementById('folder-search-input').value.toLowerCase();
    const folderGroups = document.querySelectorAll('.folder-group');
    const rootItems = document.querySelectorAll('#folder-dropdown-list > .dropdown-item'); 

    folderGroups.forEach(group => {
        const folderName = group.querySelector('.folder-name').innerText.toLowerCase();
        const setElements = group.querySelectorAll('.set-name');
        let hasMatchInSets = false;

        setElements.forEach(setEl => {
            const itemDiv = setEl.closest('.dropdown-item');
            if (setEl.innerText.toLowerCase().includes(searchText)) {
                itemDiv.style.display = 'flex';
                hasMatchInSets = true;
            } else {
                itemDiv.style.display = 'none';
            }
        });

        const childrenContainer = group.querySelector('.folder-children');
        const icon = group.querySelector('.folder-icon');
        
        if (hasMatchInSets || folderName.includes(searchText)) {
            group.style.display = 'block';
            if (searchText) { 
                childrenContainer.classList.remove('hidden');
                childrenContainer.classList.add('flex');
                icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
            }
        } else {
            group.style.display = 'none';
        }
    });

    rootItems.forEach(item => {
        if (item.innerText.toLowerCase().includes(searchText)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Chạy khởi tạo khi load xong trang
document.addEventListener('DOMContentLoaded', () => {
    initGameFilters();
});
// Chạy khởi tạo khi load xong trang
document.addEventListener('DOMContentLoaded', () => {
    initGameFilters();
});

// Hàm lõi lọc từ vựng dựa trên 4 ô Select
function fetchEligibleWords(requireExample = false, isMatchMode = false, ignoreLimit = false) {
    const folderFilter = document.getElementById('game-filter-folder') ? document.getElementById('game-filter-folder').value : 'all';
    const statusFilter = document.getElementById('game-filter-status') ? document.getElementById('game-filter-status').value : 'due';
    const orderFilter = document.getElementById('game-filter-order') ? document.getElementById('game-filter-order').value : 'random';
    const limitFilter = document.getElementById('game-filter-limit') ? parseInt(document.getElementById('game-filter-limit').value) : 20;

    const currentTime = Date.now();
    let eligible = [];

    // 1. Lọc theo Thư mục / Bộ từ
    let setsToProcess = vocabSets;
    if (folderFilter !== 'all') {
        if (folderFilter.startsWith('folder_')) {
            const fId = folderFilter.replace('folder_', '');
            const allFolderIds = getAllVocabFolderIds(fId);
            setsToProcess = vocabSets.filter(s => allFolderIds.includes(String(s.folderId)));
        } else if (folderFilter.startsWith('set_')) {
            const sId = folderFilter.replace('set_', '');
            setsToProcess = vocabSets.filter(s => String(s.id) === sId);
        }
    }

    // 2. Lọc theo Trạng thái (Chưa thuộc, Đã thuộc, Tất cả, SRS)
    setsToProcess.forEach(set => {
        if (set.words) {
            set.words.forEach(w => {
                const level = w.srsLevel || 0;
                const nextReview = w.nextReviewTime || 0;
                
                let statusMatch = false;
                if (statusFilter === 'due') statusMatch = (currentTime >= nextReview);
                else if (statusFilter === 'all') statusMatch = true;
                else if (statusFilter === 'unlearned') statusMatch = (level === 0);
                else if (statusFilter === 'learned') statusMatch = (level > 0);

                if (statusMatch) {
                    if (requireExample && !w.example) return; 
                    eligible.push({ ...w, setId: set.id, wordId: w.id, level: level });
                }
            });
        }
    });

    // 3. Sắp xếp Thứ tự
    if (orderFilter === 'random') {
        eligible.sort(() => Math.random() - 0.5);
    } // Nếu là 'sequential' thì giữ nguyên thứ tự gốc

    // 4. Giới hạn số lượng (Nối từ ép buộc là 10)
    if (ignoreLimit) return eligible; // Dùng để đếm số lượng tổng hiển thị
    const finalLimit = isMatchMode ? 10 : limitFilter;
    return eligible.slice(0, finalLimit);
}

function updateGameReadyCount() {
    const countBadge = document.getElementById('game-ready-count');
    if(countBadge) {
        const allAvailable = fetchEligibleWords(false, false, true); 
        countBadge.innerText = `${allAvailable.length} TỪ SẴN SÀNG`;
    }
}

// Hàm Switch Màn hình
function switchPlayScreen(screenId, keepData = false) {
    // 1. Quét và ẩn TẤT CẢ các màn hình bằng classList thay vì style.display
    ['quiz-play-screen', 'match-play-screen', 'type-play-screen', 'listen-play-screen', 'quiz-result-screen'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
            element.classList.remove('flex');
        }
    });

    // 2. Hiển thị màn hình mục tiêu
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        targetScreen.classList.add('flex');
    }
    
    // 3. Hiển thị modal nền tổng
    const modal = document.getElementById('quiz-game-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    
    // Nếu không có cờ keepData (chơi mix mode), reset lại toàn bộ dữ liệu
    if (!keepData) {
        quizSessionData = { total: 0, correctWords: [], wrongWords: [], srsUpdates: [] };
        gameScore = 0;
        isMixMode = false;
    }
}
// ================== GAME TỔNG HỢP (MIX MODE) ==================
function startMixMode() {
    const words = fetchEligibleWords(false, false); 
    if (words.length === 0) return alert("Không có từ nào thỏa mãn bộ lọc.");
    
    switchPlayScreen('quiz-play-screen'); 
    
    isMixMode = true;
    gameQuestions = words;
    quizSessionData.total = words.length;
    currentGameIndex = 0;
    
    loadNextMixQuestion();
}

function loadNextMixQuestion() {
    if (currentGameIndex >= gameQuestions.length) {
        showQuizResults();
        return;
    }

    // Chọn ngẫu nhiên 1 trong 3 thể loại
    const modes = ['quiz', 'type', 'listen'];
    const randomMode = modes[Math.floor(Math.random() * modes.length)];

    if (randomMode === 'quiz') {
        activeGameMode = 'quiz';
        
        // Random tiếp 1 trong 3 dạng trắc nghiệm
        const subModes = ['tu_nghia', 'nghia_tu'];
        if (gameQuestions[currentGameIndex].example) subModes.push('ngu_canh');
        currentQuizMode = subModes[Math.floor(Math.random() * subModes.length)];
        
        switchPlayScreen('quiz-play-screen', true);
        document.getElementById('quiz-score').innerText = gameScore;
        
        let modeText = currentQuizMode === 'tu_nghia' ? "TỪ ➔ NGHĨA" : (currentQuizMode === 'nghia_tu' ? "NGHĨA ➔ TỪ" : "NGỮ CẢNH · ĐIỀN TỪ");
        document.getElementById('quiz-mode-badge').innerText = modeText + " (MIX)";
        
        loadQuizQuestion();
        
    } else if (randomMode === 'type') {
        activeGameMode = 'type';
        switchPlayScreen('type-play-screen', true);
        document.getElementById('type-score').innerText = gameScore;
        loadTypeQuestion();
        
    } else if (randomMode === 'listen') {
        activeGameMode = 'listen';
        switchPlayScreen('listen-play-screen', true);
        document.getElementById('listen-score').innerText = gameScore;
        loadListenQuestion();
    }
}
// ================== GAME TRẮC NGHIỆM ==================
let currentQuizMode = '';
function startQuizMode(mode) {
    closeQuizModeModal();
    const words = fetchEligibleWords(mode === 'ngu_canh', false);
    if (words.length === 0) return alert(mode === 'ngu_canh' ? "Không có từ (chứa ví dụ) nào thỏa mãn bộ lọc." : "Không có từ nào thỏa mãn bộ lọc.");
    
    switchPlayScreen('quiz-play-screen'); 
    
    activeGameMode = 'quiz';
    currentQuizMode = mode;
    gameQuestions = words;
    quizSessionData.total = words.length; 
    currentGameIndex = 0;
    
    document.getElementById('quiz-score').innerText = gameScore;
    let modeText = mode === 'tu_nghia' ? "TỪ ➔ NGHĨA" : (mode === 'nghia_tu' ? "NGHĨA ➔ TỪ" : "NGỮ CẢNH · ĐIỀN TỪ");
    document.getElementById('quiz-mode-badge').innerText = modeText;
    loadQuizQuestion();
}

function loadQuizQuestion() {
    isAnswering = false;
    document.getElementById('quiz-feedback-overlay').classList.replace('translate-y-0', 'translate-y-full');
    
    const currentQ = gameQuestions[currentGameIndex];
    document.getElementById('quiz-progress-text').innerText = `Câu ${currentGameIndex + 1} / ${gameQuestions.length}`;
    
    const qText = document.getElementById('quiz-question-text');
    const qType = document.getElementById('quiz-question-type');
    const metaBox = document.getElementById('quiz-question-meta');

    if (currentQuizMode === 'tu_nghia') {
        qText.innerText = currentQ.term;
        qType.innerText = currentQ.wordType || 'VOCAB';
        metaBox.style.display = 'flex';
    } else if (currentQuizMode === 'nghia_tu') {
        qText.innerText = currentQ.definition;
        metaBox.style.display = 'none'; 
    } else if (currentQuizMode === 'ngu_canh') {
        const regex = new RegExp(currentQ.term, 'gi');
        qText.innerText = currentQ.example.replace(regex, '________');
        qType.innerText = currentQ.wordType || 'VOCAB';
        metaBox.style.display = 'flex';
    }

    let options = [{ text: currentQuizMode === 'tu_nghia' ? currentQ.definition : currentQ.term, isCorrect: true }];
    let allPool = [];
    vocabSets.forEach(s => { if(s.words) allPool.push(...s.words) });
    allPool.sort(() => Math.random() - 0.5); 

    for (let w of allPool) {
        if (options.length >= 4) break;
        let wrongText = currentQuizMode === 'tu_nghia' ? w.definition : w.term;
        if (wrongText && !options.some(opt => opt.text === wrongText)) options.push({ text: wrongText, isCorrect: false });
    }
    options.sort(() => Math.random() - 0.5);

    const container = document.getElementById('quiz-options-container');
    container.innerHTML = '';
    options.forEach((opt, index) => {
        container.innerHTML += `<button class="quiz-option-btn group" onclick="checkQuizAnswer(this, ${opt.isCorrect})">
            <div class="quiz-option-num group-hover:bg-[#ff6b81] group-hover:text-white">${index + 1}</div>
            <span>${opt.text}</span></button>`;
    });
    startTimer('quiz-timer-text', 'quiz-timer-bar', 30, handleQuizTimeOut);
}

function checkQuizAnswer(btn, isCorrect) {
    if (isAnswering) return;
    isAnswering = true; clearInterval(gameTimer); 
    const currentQ = gameQuestions[currentGameIndex];
    const btns = document.querySelectorAll('.quiz-option-btn');
    btns.forEach(b => b.disabled = true);

    if (isCorrect) {
        btn.classList.add('correct');
        gameScore += 10; document.getElementById('quiz-score').innerText = gameScore;
        quizSessionData.correctWords.push({word: currentQ.term, meaning: currentQ.definition});
        quizSessionData.srsUpdates.push({ setId: currentQ.setId, wordId: currentQ.wordId, newLevel: currentQ.level + 1 });
    } else {
        btn.classList.add('wrong');
        const correctBtn = Array.from(btns).find(b => b.getAttribute('onclick').includes('true'));
        if (correctBtn) correctBtn.classList.add('correct');
        quizSessionData.wrongWords.push({word: currentQ.term, meaning: currentQ.definition});
        quizSessionData.srsUpdates.push({ setId: currentQ.setId, wordId: currentQ.wordId, newLevel: 0 });
    }
    showFeedbackOverlay(isCorrect, currentQ, nextQuizQuestion);
}
function handleQuizTimeOut() {
    if (isAnswering) return;
    isAnswering = true;
    const currentQ = gameQuestions[currentGameIndex];
    document.querySelectorAll('.quiz-option-btn').forEach(b => b.disabled = true);
    quizSessionData.wrongWords.push({word: currentQ.term, meaning: currentQ.definition});
    quizSessionData.srsUpdates.push({ setId: currentQ.setId, wordId: currentQ.wordId, newLevel: 0 });
    showFeedbackOverlay(false, currentQ, nextQuizQuestion);
}
function nextQuizQuestion() {
    // Kiểm tra câu cuối TRƯỚC KHI TĂNG INDEX
    if (currentGameIndex >= gameQuestions.length - 1) {
        // Tới câu cuối rồi, hiển thị kết quả ngay
        showQuizResults(); 
        return; 
    }
    
    // Nếu chưa phải câu cuối, mới tăng và tải câu mới
    currentGameIndex++;
    if (isMixMode) loadNextMixQuestion(); else loadQuizQuestion();
}

// ================== GAME NỐI TỪ ==================
let matchHearts = 5;
let matchPairs = [];
let selectedEnBtn = null;
let selectedVnBtn = null;

function startMatchMode() {
    const words = fetchEligibleWords(false, true); // true: Ép số lượng = 10 cho Nối từ
    if (words.length < 4) return alert("Cần ít nhất 4 từ vựng thỏa mãn bộ lọc để chơi Nối từ!");
    
    switchPlayScreen('match-play-screen'); 
    
    activeGameMode = 'match';
    gameQuestions = words;
    quizSessionData.total = words.length;
    matchHearts = 5;
    
    renderMatchHearts();
    
    let enList = [...words].sort(() => Math.random() - 0.5);
    let vnList = [...words].sort(() => Math.random() - 0.5);
    
    const enCol = document.getElementById('match-col-en');
    const vnCol = document.getElementById('match-col-vn');
    enCol.innerHTML = ''; vnCol.innerHTML = '';

    enList.forEach(w => {
        enCol.innerHTML += `<button class="match-btn" data-id="${w.wordId}" onclick="selectMatchWord(this, 'en')">${w.term}</button>`;
    });
    vnList.forEach(w => {
        vnCol.innerHTML += `<button class="match-btn" data-id="${w.wordId}" onclick="selectMatchWord(this, 'vn')">${w.definition}</button>`;
    });

    document.getElementById('match-progress-text').innerText = `Đã ghép 0 / ${words.length}`;
    startTimer('match-timer-text', null, 60, handleMatchGameOver);
}

function renderMatchHearts() {
    const box = document.getElementById('match-hearts');
    box.innerHTML = '';
    for(let i=0; i<5; i++) {
        box.innerHTML += `<i class="fa-solid ${i < matchHearts ? 'fa-heart' : 'fa-heart-crack text-gray-300'}"></i>`;
    }
}

function selectMatchWord(btn, type) {
    if (btn.classList.contains('matched') || btn.classList.contains('selected')) return;
    
    // Bỏ chọn nút cũ cùng cột
    if (type === 'en') {
        if(selectedEnBtn) selectedEnBtn.classList.remove('selected');
        selectedEnBtn = btn;
    } else {
        if(selectedVnBtn) selectedVnBtn.classList.remove('selected');
        selectedVnBtn = btn;
    }
    btn.classList.add('selected');

    // Kiểm tra nếu chọn đủ 2 bên
    if (selectedEnBtn && selectedVnBtn) {
        const idEn = selectedEnBtn.getAttribute('data-id');
        const idVn = selectedVnBtn.getAttribute('data-id');
        const wordObj = gameQuestions.find(w => w.wordId == idEn);

        if (idEn === idVn) { // ĐÚNG
            selectedEnBtn.classList.replace('selected', 'matched');
            selectedVnBtn.classList.replace('selected', 'matched');
            gameScore += 10;
            quizSessionData.correctWords.push({word: wordObj.term, meaning: wordObj.definition});
            quizSessionData.srsUpdates.push({ setId: wordObj.setId, wordId: wordObj.wordId, newLevel: wordObj.level + 1 });
            
            document.getElementById('match-progress-text').innerText = `Đã ghép ${quizSessionData.correctWords.length} / ${gameQuestions.length}`;
            
            if (quizSessionData.correctWords.length === gameQuestions.length) {
                clearInterval(gameTimer);
                setTimeout(showQuizResults, 1000);
            }
        } else { // SAI
            selectedEnBtn.classList.add('error');
            selectedVnBtn.classList.add('error');
            matchHearts--;
            renderMatchHearts();
            
            setTimeout(() => {
                selectedEnBtn.classList.remove('selected', 'error');
                selectedVnBtn.classList.remove('selected', 'error');
                selectedEnBtn = null; selectedVnBtn = null;
                
                if (matchHearts <= 0) handleMatchGameOver();
            }, 500);
            return; // Tránh set null ngay lập tức bên dưới
        }
        selectedEnBtn = null; selectedVnBtn = null;
    }
}

function handleMatchGameOver() {
    clearInterval(gameTimer);
    // Những từ chưa ghép tính là sai
    const matchedIds = quizSessionData.correctWords.map(w => w.word);
    gameQuestions.forEach(w => {
        if (!matchedIds.includes(w.term)) {
            quizSessionData.wrongWords.push({word: w.term, meaning: w.definition});
            quizSessionData.srsUpdates.push({ setId: w.setId, wordId: w.wordId, newLevel: 0 });
        }
    });
    alert("Hết giờ hoặc hết tim! Đang tổng hợp kết quả...");
    showQuizResults();
}

// ================== GAME GÕ TỪ (TYPING) ==================
let typeHintsUsed = 3;
let typeRevealedIndices = []; // Biến mới: Lưu vị trí các chữ cái đã được mở

function startTypeMode() {
    const words = fetchEligibleWords(false, false);
    if (words.length === 0) return alert("Không có từ nào thỏa mãn bộ lọc.");
    
    switchPlayScreen('type-play-screen'); 

    activeGameMode = 'type';
    gameQuestions = words;
    quizSessionData.total = words.length;
    currentGameIndex = 0;
    
    document.getElementById('type-score').innerText = gameScore;
    loadTypeQuestion();
}

function loadTypeQuestion() {
    isAnswering = false;
    document.getElementById('quiz-feedback-overlay').classList.replace('translate-y-0', 'translate-y-full');
    document.getElementById('type-example-box').classList.add('hidden');
    document.getElementById('type-input-box').value = '';
    document.getElementById('type-input-box').disabled = false;
    document.getElementById('type-input-box').focus();
    
    typeHintsUsed = 3; 
    typeRevealedIndices = []; // Reset mảng vị trí đã mở khi qua câu mới
    document.getElementById('type-hint-count').innerText = typeHintsUsed;

    const currentQ = gameQuestions[currentGameIndex];
    document.getElementById('type-progress-text').innerText = `Câu ${currentGameIndex + 1} / ${gameQuestions.length}`;
    document.getElementById('type-question-text').innerText = currentQ.definition;
    document.getElementById('type-question-type').innerText = currentQ.wordType || 'VOCAB';
    
    // Render chuỗi ẩn
    updateTypeHintDisplay();
    startTimer('type-timer-text', 'type-timer-bar', 30, handleTypeTimeOut);
}

function updateTypeHintDisplay() {
    const word = gameQuestions[currentGameIndex].term;
    let display = '';
    
    // Quét từng chữ cái, nếu đã được random trúng thì hiển thị, chưa thì ẩn
    for(let i = 0; i < word.length; i++) {
        if (word[i] === ' ') {
            display += '\u00A0\u00A0'; // Ký tự space
        } else if (typeRevealedIndices.includes(i)) {
            display += word[i];
        } else {
            display += '_';
        }
    }
    document.getElementById('type-hint-display').innerText = display;
}

function useTypeHint() {
    if (typeHintsUsed > 0 && !isAnswering) {
        const word = gameQuestions[currentGameIndex].term;
        
        // Tính số lượng chữ cái tối đa được phép mở (Không quá 50% chữ cái thật, bỏ qua khoảng trắng)
        const actualLetters = word.replace(/ /g, '').length;
        const maxRevealCount = Math.floor(actualLetters / 2);
        
        if (typeRevealedIndices.length >= maxRevealCount) {
            alert("Đã hiển thị tối đa 50% số chữ cái của từ này để đảm bảo thử thách!");
            document.getElementById('type-input-box').focus();
            return;
        }

        // Lọc ra các vị trí chưa được mở và không phải là khoảng trắng
        let availableIndices = [];
        for(let i = 0; i < word.length; i++) {
            if (word[i] !== ' ' && !typeRevealedIndices.includes(i)) {
                availableIndices.push(i);
            }
        }

        // Random 1 vị trí bất kỳ và mở nó
        if (availableIndices.length > 0) {
            const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            typeRevealedIndices.push(randomIndex);
            
            typeHintsUsed--;
            document.getElementById('type-hint-count').innerText = typeHintsUsed;
            updateTypeHintDisplay();
        }
        
        document.getElementById('type-input-box').focus();
    }
}

function toggleTypeExample() {
    const box = document.getElementById('type-example-box');
    if (box.classList.contains('hidden')) {
        const currentQ = gameQuestions[currentGameIndex];
        if (currentQ.example) {
            const regex = new RegExp(currentQ.term, 'gi');
            box.innerText = currentQ.example.replace(regex, '________');
        } else {
            box.innerText = "Từ này chưa có câu ví dụ.";
        }
        box.classList.remove('hidden');
    } else {
        box.classList.add('hidden');
    }
    document.getElementById('type-input-box').focus();
}

function checkTypeAnswer() {
    if (isAnswering) return;
    const input = document.getElementById('type-input-box').value.trim().toLowerCase();
    if (!input) return;

    isAnswering = true;
    clearInterval(gameTimer);
    document.getElementById('type-input-box').disabled = true;

    const currentQ = gameQuestions[currentGameIndex];
    const isCorrect = input === currentQ.term.toLowerCase();

    if (isCorrect) {
        gameScore += 10; document.getElementById('type-score').innerText = gameScore;
        quizSessionData.correctWords.push({word: currentQ.term, meaning: currentQ.definition});
        quizSessionData.srsUpdates.push({ setId: currentQ.setId, wordId: currentQ.wordId, newLevel: currentQ.level + 1 });
    } else {
        quizSessionData.wrongWords.push({word: currentQ.term, meaning: currentQ.definition});
        quizSessionData.srsUpdates.push({ setId: currentQ.setId, wordId: currentQ.wordId, newLevel: 0 });
    }
    showFeedbackOverlay(isCorrect, currentQ, nextTypeQuestion);
}

function handleTypeTimeOut() {
    if (isAnswering) return;
    isAnswering = true;
    document.getElementById('type-input-box').disabled = true;
    const currentQ = gameQuestions[currentGameIndex];
    quizSessionData.wrongWords.push({word: currentQ.term, meaning: currentQ.definition});
    quizSessionData.srsUpdates.push({ setId: currentQ.setId, wordId: currentQ.wordId, newLevel: 0 });
    showFeedbackOverlay(false, currentQ, nextTypeQuestion);
}

function nextTypeQuestion() {
    if (currentGameIndex >= gameQuestions.length - 1) showQuizResults();
    else { 
        currentGameIndex++; 
        if (isMixMode) loadNextMixQuestion(); else loadTypeQuestion(); 
    }
}

// Bắt phím Enter, Ctrl+Space, Ctrl+E cho Type Game
document.getElementById('type-input-box')?.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') checkTypeAnswer();
});
document.addEventListener('keydown', function(e) {
    if (activeGameMode === 'type' && !isAnswering) {
        if (e.ctrlKey && e.code === 'Space') { e.preventDefault(); useTypeHint(); }
        if (e.ctrlKey && e.code === 'KeyE') { e.preventDefault(); toggleTypeExample(); }
    }
});
// ================== GAME NGHE VIẾT (LISTEN & TYPE) ==================
let listenHintsUsed = 3;
let listenRevealedIndices = []; 

function startListenMode() {
    const words = fetchEligibleWords(false, false);
    if (words.length === 0) return alert("Không có từ nào thỏa mãn bộ lọc.");
    
    switchPlayScreen('listen-play-screen'); 

    activeGameMode = 'listen';
    gameQuestions = words;
    quizSessionData.total = words.length;
    currentGameIndex = 0;
    
    document.getElementById('listen-score').innerText = gameScore;
    loadListenQuestion();
}

function loadListenQuestion() {
    isAnswering = false;
    document.getElementById('quiz-feedback-overlay').classList.replace('translate-y-0', 'translate-y-full');
    document.getElementById('listen-example-box').classList.add('hidden');
    document.getElementById('listen-input-box').value = '';
    document.getElementById('listen-input-box').disabled = false;
    document.getElementById('listen-input-box').focus();
    
    listenHintsUsed = 3; 
    listenRevealedIndices = []; 
    document.getElementById('listen-hint-count').innerText = listenHintsUsed;

    const currentQ = gameQuestions[currentGameIndex];
    document.getElementById('listen-progress-text').innerText = `Câu ${currentGameIndex + 1} / ${gameQuestions.length}`;
    document.getElementById('listen-question-type').innerText = currentQ.wordType || 'VOCAB';
    
    updateListenHintDisplay();
    startTimer('listen-timer-text', 'listen-timer-bar', 30, handleListenTimeOut);
    
    // Tự động phát âm thanh khi bắt đầu câu mới
    setTimeout(playListenAudio, 300);
}

// Hàm đọc Text-to-Speech của hệ thống
function playListenAudio() {
    if (isAnswering) return;
    const word = gameQuestions[currentGameIndex].term;
    const speech = new SpeechSynthesisUtterance(word);
    speech.lang = 'en-US'; // Chuẩn giọng Anh Mỹ
    speech.rate = 0.9;     // Chỉnh tốc độ đọc chậm một xíu để dễ nghe
    window.speechSynthesis.speak(speech);
}

function updateListenHintDisplay() {
    const word = gameQuestions[currentGameIndex].term;
    let display = '';
    
    for(let i = 0; i < word.length; i++) {
        if (word[i] === ' ') display += '\u00A0\u00A0'; 
        else if (listenRevealedIndices.includes(i)) display += word[i];
        else display += '_';
    }
    document.getElementById('listen-hint-display').innerText = display;
}

function useListenHint() {
    if (listenHintsUsed > 0 && !isAnswering) {
        const word = gameQuestions[currentGameIndex].term;
        const actualLetters = word.replace(/ /g, '').length;
        const maxRevealCount = Math.floor(actualLetters / 2); // Giới hạn gợi ý tối đa 50%
        
        if (listenRevealedIndices.length >= maxRevealCount) {
            alert("Đã hiển thị tối đa 50% số chữ cái của từ này để đảm bảo thử thách!");
            document.getElementById('listen-input-box').focus();
            return;
        }

        let availableIndices = [];
        for(let i = 0; i < word.length; i++) {
            if (word[i] !== ' ' && !listenRevealedIndices.includes(i)) availableIndices.push(i);
        }

        if (availableIndices.length > 0) {
            const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            listenRevealedIndices.push(randomIndex);
            
            listenHintsUsed--;
            document.getElementById('listen-hint-count').innerText = listenHintsUsed;
            updateListenHintDisplay();
        }
        document.getElementById('listen-input-box').focus();
    }
}

function toggleListenExample() {
    const box = document.getElementById('listen-example-box');
    if (box.classList.contains('hidden')) {
        const currentQ = gameQuestions[currentGameIndex];
        if (currentQ.example) {
            const regex = new RegExp(currentQ.term, 'gi');
            box.innerText = currentQ.example.replace(regex, '________');
        } else {
            box.innerText = "Từ này chưa có câu ví dụ.";
        }
        box.classList.remove('hidden');
    } else {
        box.classList.add('hidden');
    }
    document.getElementById('listen-input-box').focus();
}

function checkListenAnswer() {
    if (isAnswering) return;
    const input = document.getElementById('listen-input-box').value.trim().toLowerCase();
    if (!input) return;

    isAnswering = true;
    clearInterval(gameTimer);
    document.getElementById('listen-input-box').disabled = true;

    const currentQ = gameQuestions[currentGameIndex];
    const isCorrect = input === currentQ.term.toLowerCase();

    if (isCorrect) {
        gameScore += 10; document.getElementById('listen-score').innerText = gameScore;
        quizSessionData.correctWords.push({word: currentQ.term, meaning: currentQ.definition});
        quizSessionData.srsUpdates.push({ setId: currentQ.setId, wordId: currentQ.wordId, newLevel: currentQ.level + 1 });
    } else {
        quizSessionData.wrongWords.push({word: currentQ.term, meaning: currentQ.definition});
        quizSessionData.srsUpdates.push({ setId: currentQ.setId, wordId: currentQ.wordId, newLevel: 0 });
    }
    showFeedbackOverlay(isCorrect, currentQ, nextListenQuestion);
}

function handleListenTimeOut() {
    if (isAnswering) return;
    isAnswering = true;
    document.getElementById('listen-input-box').disabled = true;
    const currentQ = gameQuestions[currentGameIndex];
    quizSessionData.wrongWords.push({word: currentQ.term, meaning: currentQ.definition});
    quizSessionData.srsUpdates.push({ setId: currentQ.setId, wordId: currentQ.wordId, newLevel: 0 });
    showFeedbackOverlay(false, currentQ, nextListenQuestion);
}

function nextListenQuestion() {
    if (currentGameIndex >= gameQuestions.length - 1) showQuizResults();
    else { 
        currentGameIndex++; 
        if (isMixMode) loadNextMixQuestion(); else loadListenQuestion(); 
    }
}

// Bắt phím tắt cho Nghe Viết
document.getElementById('listen-input-box')?.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') checkListenAnswer();
});
document.addEventListener('keydown', function(e) {
    if (activeGameMode === 'listen' && !isAnswering) {
        if (e.ctrlKey && e.code === 'KeyX') { e.preventDefault(); playListenAudio(); }
        if (e.ctrlKey && e.code === 'Space') { e.preventDefault(); useListenHint(); }
        if (e.ctrlKey && e.code === 'KeyE') { e.preventDefault(); toggleListenExample(); }
    }
});

// Sửa hàm cancelExitQuiz để support thêm mode 'listen'
function cancelExitQuiz() {
    document.getElementById('quiz-exit-modal').style.display = 'none';
    if (!isAnswering && document.getElementById('quiz-feedback-overlay').classList.contains('translate-y-full')) {
        if(activeGameMode === 'quiz') startTimer('quiz-timer-text', 'quiz-timer-bar', timeLeft, handleQuizTimeOut);
        else if(activeGameMode === 'match') startTimer('match-timer-text', null, timeLeft, handleMatchGameOver);
        else if(activeGameMode === 'type') startTimer('type-timer-text', 'type-timer-bar', timeLeft, handleTypeTimeOut);
        else if(activeGameMode === 'listen') startTimer('listen-timer-text', 'listen-timer-bar', timeLeft, handleListenTimeOut); // <-- MỚI THÊM
    }
}
window.onload = function() {
    if (window.location.pathname.includes('game.html')) {
        // Xóa dữ liệu tạm của bài làm trước đó nếu user thoát ngang
        localStorage.removeItem('tempTest');
        // Reset trạng thái ban đầu cho các game
        isAnswering = false;
        currentGameIndex = 0;
    }
};
// ================== HÀM DÙNG CHUNG ==================

function startTimer(textId, barId, time, timeoutCallback) {
    clearInterval(gameTimer);
    timeLeft = time;
    document.getElementById(textId).innerText = timeLeft + 's';
    if (barId) {
        document.getElementById(barId).style.width = '100%';
        document.getElementById(barId).className = "bg-[#ff9eb5] h-full rounded-full transition-all duration-1000 ease-linear";
    }

    gameTimer = setInterval(() => {
        timeLeft--;
        document.getElementById(textId).innerText = timeLeft + 's';
        if (barId) {
            document.getElementById(barId).style.width = (timeLeft / time) * 100 + '%';
            if (timeLeft <= 10) document.getElementById(barId).classList.replace('bg-[#ff9eb5]', 'bg-red-500');
        }
        if (timeLeft <= 0) { clearInterval(gameTimer); timeoutCallback(); }
    }, 1000);
}

let nextActionCallback = null;
function showFeedbackOverlay(isCorrect, wordObj, callback) {
    nextActionCallback = callback;
    const overlay = document.getElementById('quiz-feedback-overlay');
    const icon = document.getElementById('feedback-icon');
    
    overlay.classList.remove('translate-y-full');
    overlay.classList.add('translate-y-0');
    
    if (isCorrect) {
        overlay.classList.add('feedback-correct'); overlay.classList.remove('feedback-wrong');
        icon.innerHTML = '<i class="fa-solid fa-check"></i>';
    } else {
        overlay.classList.add('feedback-wrong'); overlay.classList.remove('feedback-correct');
        icon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    }
    
    document.getElementById('feedback-word').innerText = wordObj.term; // Dùng .term (Nối/Gõ) hoặc word (Trắc nghiệm tuỳ object)
    if (!wordObj.term && wordObj.word) document.getElementById('feedback-word').innerText = wordObj.word;
    
    document.getElementById('feedback-type').innerText = wordObj.type || wordObj.wordType || '';
    document.getElementById('feedback-pron').innerText = wordObj.pronunciation || '';
    document.getElementById('feedback-meaning').innerText = wordObj.meaning || wordObj.definition || '';
    
    const exContainer = document.getElementById('feedback-example-container');
    if (wordObj.example) {
        exContainer.style.display = 'block';
        exContainer.innerHTML = `<i class="fa-solid fa-quote-left opacity-50 mr-1"></i> ${wordObj.example}`;
    } else exContainer.style.display = 'none';

    let fbCount = 3;
    const btnNext = document.getElementById('btn-next-question');
    btnNext.innerText = `Tiếp tục (${fbCount}s)`;
    
    clearInterval(feedbackTimer);
    feedbackTimer = setInterval(() => {
        fbCount--; btnNext.innerText = `Tiếp tục (${fbCount}s)`;
        if (fbCount <= 0) nextFromFeedback();
    }, 1000);
}

function nextFromFeedback() {
    clearInterval(feedbackTimer);
    document.getElementById('quiz-feedback-overlay').classList.replace('translate-y-0', 'translate-y-full');
    setTimeout(() => { if (nextActionCallback) nextActionCallback(); }, 300);
}

function showQuizResults() {
    // 1. Ẩn tất cả các màn hình chơi game (đã bổ sung listen-play-screen)
    ['quiz-play-screen', 'match-play-screen', 'type-play-screen', 'listen-play-screen'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
            element.classList.remove('flex');
        }
    });
    
    // 2. Hiển thị màn hình Kết quả
    const resScreen = document.getElementById('quiz-result-screen');
    if (resScreen) {
        resScreen.classList.remove('hidden');
        resScreen.classList.add('flex');
    }

    // 3. Tính toán dữ liệu
    const cCount = quizSessionData.correctWords.length;
    const wCount = quizSessionData.wrongWords.length;
    const percent = quizSessionData.total > 0 ? Math.round((cCount / quizSessionData.total) * 100) : 0;

    // 4. Đẩy dữ liệu lên giao diện
    const resCorrect = document.getElementById('res-correct-count');
    if (resCorrect) resCorrect.innerText = cCount;

    const resWrong = document.getElementById('res-wrong-count');
    if (resWrong) resWrong.innerText = wCount;

    const resCoin = document.getElementById('res-coin-earned');
    if (resCoin) resCoin.innerText = `+${gameScore}`;

    const resPercent = document.getElementById('result-percent');
    if (resPercent) resPercent.innerText = `${percent}%`;

    // Hiệu ứng vòng tròn %
    const offset = (2 * Math.PI * 45) * (1 - percent/100);
    const pieChart = document.getElementById('result-pie-chart');
    if (pieChart) {
        setTimeout(() => { pieChart.style.strokeDashoffset = offset; }, 100);
    }

    // Render danh sách Từ đúng
    const countCorrectList = document.getElementById('count-correct-list');
    if (countCorrectList) countCorrectList.innerText = cCount;

    const correctWordsList = document.getElementById('correct-words-list');
    if (correctWordsList) {
        correctWordsList.innerHTML = quizSessionData.correctWords.map(w => `
            <div class="flex justify-between items-center py-2 border-b border-[#bbf7d0] last:border-0">
                <span class="font-extrabold text-green-800">${w.word}</span><span class="text-xs font-bold text-green-600">${w.meaning}</span>
            </div>`).join('');
    }

    // Render danh sách Từ sai
    const countWrongList = document.getElementById('count-wrong-list');
    if (countWrongList) countWrongList.innerText = wCount;

    const wrongWordsList = document.getElementById('wrong-words-list');
    if (wrongWordsList) {
        wrongWordsList.innerHTML = quizSessionData.wrongWords.map(w => `
            <div class="flex justify-between items-center py-2 border-b border-[#ffe4e6] last:border-0">
                <span class="font-extrabold text-red-800">${w.word}</span><span class="text-xs font-bold text-red-500">${w.meaning}</span>
            </div>`).join('');
    }
}

function commitQuizResults() {
    quizSessionData.srsUpdates.forEach(update => {
        const setIndex = vocabSets.findIndex(s => s.id === update.setId);
        if (setIndex > -1) {
            const wordIndex = vocabSets[setIndex].words.findIndex(w => w.id === update.wordId);
            if (wordIndex > -1) {
                let lvl = update.newLevel > 8 ? 8 : update.newLevel;
                let nextTime = lvl > 0 ? Date.now() + SRS_INTERVALS[lvl] : 0;
                vocabSets[setIndex].words[wordIndex].srsLevel = lvl;
                vocabSets[setIndex].words[wordIndex].nextReviewTime = nextTime;
            }
        }
    });
    localStorage.setItem('vocabSets', JSON.stringify(vocabSets));
    document.getElementById('quiz-game-modal').classList.add('hidden');
    document.getElementById('quiz-game-modal').classList.remove('flex');
}
// Thay thế hàm cũ bằng hàm này
function requestExitQuiz() {
    // Dừng tất cả các loại đồng hồ có thể đang chạy
    clearInterval(gameTimer);
    clearInterval(feedbackTimer);
    
    // Hiển thị modal xác nhận
    const exitModal = document.getElementById('quiz-exit-modal');
    if (exitModal) {
        exitModal.style.display = 'flex';
        exitModal.classList.remove('hidden');
    }
}
function cancelExitQuiz() {
    document.getElementById('quiz-exit-modal').style.display = 'none';
    if (!isAnswering && document.getElementById('quiz-feedback-overlay').classList.contains('translate-y-full')) {
        // Tùy theo game đang chơi mà gọi lại hàm Timer tương ứng
        if(activeGameMode === 'quiz') startTimer('quiz-timer-text', 'quiz-timer-bar', timeLeft, handleQuizTimeOut);
        else if(activeGameMode === 'match') startTimer('match-timer-text', null, timeLeft, handleMatchGameOver);
        else if(activeGameMode === 'type') startTimer('type-timer-text', 'type-timer-bar', timeLeft, handleTypeTimeOut);
    }
}
function forceExitQuiz() {
    document.getElementById('quiz-exit-modal').style.display = 'none';
    document.getElementById('quiz-game-modal').classList.add('hidden');
    document.getElementById('quiz-game-modal').classList.remove('flex');
}

// Bắt phím số cho Trắc nghiệm (giữ nguyên)
document.addEventListener("keydown", function(e) {
    const modal = document.getElementById('quiz-game-modal');
    if (modal && !modal.classList.contains('hidden') && !isAnswering && activeGameMode === 'quiz') {
        if (e.key >= "1" && e.key <= "4") {
            const btns = document.querySelectorAll('.quiz-option-btn');
            if (btns[e.key - 1]) btns[e.key - 1].click(); 
        }
    }
});

// Đoạn code xử lý mô phỏng AI và tính toán đục lỗ
let currentListenMode = 'gap';
let rawTranscript = "I decided to go to the park today because the weather was absolutely beautiful and I wanted to see the flowers.";
let sentences = [
    "I decided to go to the park today.",
    "Because the weather was absolutely beautiful.",
    "And I wanted to see the flowers."
];

function simulateAI() {
    const link = document.getElementById('yt-link').value.trim();
    const level = document.getElementById('listen-level').value;
    
    if (!link || !level) return alert("Vui lòng dán link Youtube và chọn trình độ!");

    // Bóc tách ID video chuẩn
    function getYouTubeVideoId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    const videoId = getYouTubeVideoId(link);

    if (!videoId) {
        return alert("Link YouTube không hợp lệ. Vui lòng kiểm tra lại!");
    }

    // Hiển thị workspace
    document.getElementById('listening-workspace').classList.remove('hidden');
    
    // Đổi sang youtube-nocookie.com và thêm tham số origin
    document.getElementById('yt-player-container').innerHTML = 
        `<iframe class="w-full h-full rounded-2xl" src="https://www.youtube-nocookie.com/embed/${videoId}?rel=0&origin=http://localhost" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;

    initListeningGame();
}

function initListeningGame() {
    const level = document.getElementById('listen-level').value;
    const container = document.getElementById('listening-content');
    container.innerHTML = '';

    if (currentListenMode === 'gap') {
        renderGapMode(level);
    } else {
        renderSentenceMode();
    }
}

function renderGapMode(level) {
    const container = document.getElementById('listening-content');
    let words = rawTranscript.split(' ');
    
    // Tỷ lệ đục lỗ theo level
    const gapRates = { 'A1': 0.1, 'A2': 0.2, 'B1': 0.3, 'B2': 0.4, 'C1': 0.5, 'C2': 0.6 };
    const rate = gapRates[level] || 0.2;

    let html = '<div class="text-lg leading-loose text-gray-700 font-medium">';
    words.forEach((word, index) => {
        // Loại bỏ dấu câu khi so khớp
        let cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        
        if (Math.random() < rate && cleanWord.length > 3) {
            html += `<input type="text" class="gap-input" data-answer="${cleanWord.toLowerCase()}" autocomplete="off"> `;
        } else {
            html += `<span>${word}</span> `;
        }
    });
    html += '</div>';
    container.innerHTML = html;
}

function renderSentenceMode() {
    const container = document.getElementById('listening-content');
    let html = '<div class="space-y-2">';
    sentences.forEach((s, i) => {
        html += `
            <div class="sentence-row">
                <div class="play-sentence-btn" onclick="playSentence(this, ${i})">
                    <i class="fa-solid fa-volume-high text-xs"></i>
                </div>
                <div class="flex-1">
                    <input type="text" placeholder="Nghe và gõ lại câu này..." 
                        class="w-full bg-transparent border-b border-dashed border-gray-300 outline-none focus:border-[#ff9eb5] py-1 text-gray-700 sentence-input"
                        data-answer="${s.toLowerCase()}">
                </div>
            </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

function playSentence(btn, index) {
    // Tắt tất cả loa khác
    document.querySelectorAll('.play-sentence-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Giả lập đọc câu (Sử dụng Web Speech API)
    window.speechSynthesis.cancel();
    let msg = new SpeechSynthesisUtterance(sentences[index]);
    msg.lang = 'en-US';
    msg.onend = () => btn.classList.remove('active');
    window.speechSynthesis.speak(msg);
}

function checkListeningAnswers() {
    const inputs = document.querySelectorAll('#listening-content input');
    
    inputs.forEach(input => {
        const userVal = input.value.trim().toLowerCase();
        const correctVal = input.getAttribute('data-answer');
        const parent = input.parentElement;

        let resultSpan = document.createElement('span');

        if (userVal === correctVal) {
            // Đúng: Màu xanh
            resultSpan.className = 'word-correct';
            resultSpan.innerText = input.value;
        } else if (userVal === "") {
            // Bỏ trống: Đáp án màu vàng
            resultSpan.innerHTML = `<span class="word-missing">${correctVal}</span>`;
        } else {
            // Sai: Đỏ gạch + Đáp án bên cạnh
            resultSpan.innerHTML = `<span class="word-wrong">${userVal}</span><span class="word-answer-wrong">(${correctVal})</span>`;
        }

        input.replaceWith(resultSpan);
    });
}

function switchListenMode(mode) {
    currentListenMode = mode;
    document.getElementById('btn-mode-gap').className = mode === 'gap' ? 'mode-active px-6 py-2 rounded-full font-bold text-sm border-2 border-[#ff9eb5]' : 'px-6 py-2 rounded-full font-bold text-sm border-2 border-[#ffb3c6] text-gray-400';
    document.getElementById('btn-mode-sentence').className = mode === 'sentence' ? 'mode-active px-6 py-2 rounded-full font-bold text-sm border-2 border-[#ff9eb5]' : 'px-6 py-2 rounded-full font-bold text-sm border-2 border-[#ffb3c6] text-gray-400';
    initListeningGame();
}
// --- 1. Band điểm logic ---
function updateBandOptions() {
    if (!document.getElementById('band-type-1')) return;
    const type1 = document.getElementById('band-type-1').value;
    const type2 = document.getElementById('band-type-2');
    type2.innerHTML = '';
    
    if (type1 === 'ielts') {
        for (let i = 4.0; i <= 9.0; i += 0.5) {
            type2.innerHTML += `<option value="${i}">${i}</option>`;
        }
    } else {
        for (let i = 400; i <= 900; i += 50) {
            type2.innerHTML += `<option value="${i}">${i}</option>`;
        }
    }
}

// --- 2. Chuỗi ngày học (Streak) ---
function checkStreak() {
    // Kiểm tra vocab, grammar, exams, skills trong ngày hôm nay
    const lastActivity = localStorage.getItem('lastActivityDate');
    const today = new Date().toDateString();
    
    // Logic: Nếu có nộp bài hôm nay -> streak++, không thì reset = 0
    // Bạn cần gắn hàm này vào sau mỗi sự kiện nộp bài của các module
    if (lastActivity !== today) {
        // Logic kiểm tra dữ liệu nộp bài...
        localStorage.setItem('streak', 0); // ví dụ
    }
}

// --- 3. Render Lịch theo thời gian thực ---
function renderRealTimeCalendar() {
    if (!document.getElementById('calendar-title')) return; 

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    document.getElementById('calendar-title').innerText = `HOẠT ĐỘNG HỌC TẬP - THÁNG ${month} - ${year}`;
    
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, now.getMonth(), 1).getDay(); // Thứ của ngày đầu tháng
    const calendarBody = document.getElementById('calendar-body');
    
    // Header T2-CN
    calendarBody.innerHTML = '<div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div><div>CN</div>';
    
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) calendarBody.innerHTML += '<div></div>';
    
    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = d === now.getDate() ? 'border border-red-400 text-red-500 rounded-full' : '';
        calendarBody.innerHTML += `<div class="w-7 h-7 flex items-center justify-center ${isToday}">${d}</div>`;
    }
}

// --- 4. Biểu đồ thống kê (Dữ liệu mặc định bằng 0) ---
function renderChart() {
    const stats = JSON.parse(localStorage.getItem('dailyStats')) || [0, 0, 0, 0, 0, 0, 0];
    const maxVal = Math.max(...stats, 50); // Lấy giá trị cao nhất hoặc ít nhất là 50
    const container = document.getElementById('chart-container');
    if (!container) return;
    // Thêm trục đứng linh động
    let axisHTML = `
        <div class="flex flex-col justify-between h-full text-[10px] text-gray-400 font-bold pb-1">
            <span>${maxVal}</span><span>${Math.round(maxVal/2)}</span><span>0</span>
        </div>`;

    container.innerHTML = axisHTML + stats.map((val, i) => `
        <div class="flex flex-col items-center flex-1">
            <div class="w-full bg-pink-200 rounded-t-md hover:bg-pink-400 transition-all" 
                 style="height: ${(val / maxVal) * 100}%" title="${val} từ"></div>
            <span class="text-[10px] text-gray-400 mt-2 font-bold">T${i+2}</span>
        </div>
    `).join('');
}

// Cập nhật hàm gọi mặc định
document.addEventListener('DOMContentLoaded', () => {
    updateBandOptions();
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('btn-toggle-sidebar');
    const sidebarIcon = document.getElementById('sidebar-icon');
    if (toggleSidebarBtn && sidebar && sidebarIcon) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            sidebarIcon.classList.toggle('fa-angles-left');
            sidebarIcon.classList.toggle('fa-angles-right');
        });
    }
   // 2. Các hàm khởi tạo có kiểm tra phần tử an toàn
    if (document.getElementById('motivational-quote')) {
        const quotes = ["Mỗi ngày cố gắng một chút...", "Kỷ luật là cầu nối..."];
        document.getElementById('motivational-quote').innerText = quotes[Math.floor(Math.random() * quotes.length)];
    }

    if (document.getElementById('folder-list')) {
        renderFolders();
        updateFolderSelect();
    }
    
    if (document.getElementById('vocab-folder-list')) {
        renderVocabFolders();
        updateVocabSelects();
    }
    
    if (document.getElementById('all-vocab-list')) {
        renderAllVocabList();
    }

    // Các hàm cho Dashboard (index.html) - CHỈ CHẠY KHI TỒN TẠI PHẦN TỬ
    if (document.getElementById('band-type-1')) updateBandOptions();
    if (document.getElementById('calendar-title')) renderRealTimeCalendar();
    if (document.getElementById('chart-container')) renderChart();
    
    const streakEl = document.getElementById('streak-count');
    if (streakEl) {
        const streak = localStorage.getItem('streak') || 0;
        streakEl.innerText = streak + ' ngày';
    }

    // Các hàm luôn cần chạy
    renderHomeGrammar();
    renderHistory();
});

// Gọi hàm khi khởi tạo
renderRealTimeCalendar();
renderChart();

// Đóng/mở menu
function toggleDropdown(event, menuId) {
    if (event) event.stopPropagation();
    
    const targetMenu = document.getElementById(menuId);
    
    // THÊM KIỂM TRA NÀY ĐỂ TRÁNH LỖI NULL
    if (!targetMenu) {
        console.error("Không tìm thấy phần tử có ID: " + menuId);
        return; 
    }

    // Đóng các menu khác
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu.id !== menuId) {
            menu.classList.add('hidden');
            menu.classList.remove('flex');
        }
    });

    // Toggle menu hiện tại
    targetMenu.classList.toggle('hidden');
    targetMenu.classList.toggle('flex');
}

// Áp dụng bộ lọc
function applyFilter(status, label) {
    document.getElementById('current-filter').innerText = label;
    document.getElementById('filter-dropdown').classList.add('hidden');
    
    const allQuestions = document.querySelectorAll('.question-card');
    allQuestions.forEach(q => {
        const qStatus = q.getAttribute('data-status');
        q.style.display = (status === 'all' || qStatus === status) ? 'block' : 'none';
    });
}
// ==========================================
// 17. LOGIC CHO PHẦN LUYỆN ĐỀ (EXAMS)
// ==========================================
let examFolders = JSON.parse(localStorage.getItem('examFolders')) || [];
let examQuizzes = JSON.parse(localStorage.getItem('examQuizzes')) || [];
let currentExamFolderId = null;

// Khởi tạo trang Luyện đề
function renderExamFolders() {
    // 1. Lấy đúng dữ liệu thư mục của phần Exam
    let examFolders = JSON.parse(localStorage.getItem('examFolders')) || [];
    const list = document.getElementById('exam-folder-list');
    if (!list) return; // Nếu không tìm thấy div này thì dừng
    
    list.innerHTML = '';
    
    const rootFolders = examFolders.filter(f => !f.parentId);
    
    if (rootFolders.length === 0) {
        list.innerHTML = '<p class="text-gray-500 font-bold p-4">Chưa có thư mục đề thi nào.</p>';
        return;
    }

    rootFolders.forEach(f => {
        // Render thẻ thư mục
        list.innerHTML += `
            <div class="bg-white p-6 rounded-3xl border-2 border-[#ffe4e6] shadow-sm cursor-pointer hover:border-[#ffb3c6] transition-all" onclick="openExamFolder(${f.id})">
                <div class="flex items-center gap-4">
                    <div class="text-3xl text-[#ffb3c6]"><i class="fa-solid fa-folder"></i></div>
                    <div>
                        <h4 class="font-extrabold text-[#2d3748] text-lg">${f.name}</h4>
                        <p class="text-sm text-[#ff9eb5] font-bold">Mở thư mục</p>
                    </div>
                </div>
            </div>`;
    });
}
// Hàm đệ quy lấy tất cả folder con
function getAllExamFolderIds(folderId) {
    let ids = [String(folderId)];
    let children = examFolders.filter(f => f.parentId == folderId).map(f => String(f.id));
    children.forEach(childId => { ids = ids.concat(getAllExamFolderIds(childId)); });
    return ids;
}

function openCreateExamFolderModal() {
    const name = prompt("Nhập tên thư mục đề thi mới:");
    if (name) {
        examFolders.push({ id: Date.now(), name: name });
        localStorage.setItem('examFolders', JSON.stringify(examFolders));
        renderExamFolders();
    }
}

// Xử lý bài thi
function promptExamTestOptions(mode) {
    // Logic tương tự grammar: chọn số lượng câu rồi chuyển trang
    alert("Tính năng chọn số lượng câu hỏi đang được phát triển!");
    // Sau khi chọn xong, lưu dữ liệu tạm vào localStorage và chuyển trang:
    // window.location.href = 'exam-test.html';
}

// Xử lý lịch sử thi (Kết nối với exam-history.html)
function loadExamHistory() {
    const list = document.getElementById('exam-history-list');
    if (!list) return;
    
    let history = JSON.parse(localStorage.getItem('examHistory')) || [];
    if (history.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-400 font-bold py-10">Chưa có lịch sử làm đề.</p>';
        return;
    }
    // Render danh sách tương tự hàm renderHistory()
}
// --- QUẢN LÝ THƯ MỤC ---
function deleteExamFolder(id) {
    if (confirm('Bạn có chắc muốn xoá thư mục này? (Mọi đề thi bên trong sẽ bị xoá)')) {
        examFolders = examFolders.filter(f => f.id !== id);
        examQuizzes = examQuizzes.filter(q => q.folderId !== id);
        localStorage.setItem('examFolders', JSON.stringify(examFolders));
        localStorage.setItem('examQuizzes', JSON.stringify(examQuizzes));
        renderExamFolders();
    }
}

function editExamFolder(id) {
    const folder = examFolders.find(f => f.id === id);
    const newName = prompt("Nhập tên thư mục mới:", folder.name);
    if (newName) {
        folder.name = newName;
        localStorage.setItem('examFolders', JSON.stringify(examFolders));
        renderExamFolders();
    }
}

// --- QUẢN LÝ ĐỀ THI (Quizzes) ---
function deleteExamQuiz(id) {
    if (confirm('Bạn có chắc muốn xoá đề thi này?')) {
        examQuizzes = examQuizzes.filter(q => q.id !== id);
        localStorage.setItem('examQuizzes', JSON.stringify(examQuizzes));
        renderExamList(); // Render lại danh sách đề sau khi xoá
    }
}

function editExamQuiz(id) {
    const quiz = examQuizzes.find(q => q.id === id);
    const newName = prompt("Nhập tên đề thi mới:", quiz.name);
    if (newName) {
        quiz.name = newName;
        localStorage.setItem('examQuizzes', JSON.stringify(examQuizzes));
        renderExamList();
    }
}
// --- ĐÓNG/MỞ MODAL ---
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
    document.getElementById(id).classList.add('flex');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
    document.getElementById(id).classList.remove('flex');
}

// --- XỬ LÝ NÚT TẠO ĐỀ ---
// Gọi hàm này khi click nút "Tạo đề" trong trang chi tiết thư mục
function handleCreateQuiz() {
    const name = document.getElementById('new-quiz-name').value;
    if (name && currentExamFolderId) {
        saveExamQuiz(name, currentExamFolderId); // Gọi hàm lưu của bạn
        closeModal('modal-create-quiz');
        document.getElementById('new-quiz-name').value = '';
    } else {
        alert("Vui lòng nhập tên đề thi!");
    }
}

// --- ĐIỀU HƯỚNG MỞ ĐỀ THI ---
function openExam(quizId) {
    // Lưu ID đề thi hiện tại để trang exam-test.html biết phải load đề nào
    localStorage.setItem('currentQuizId', quizId);
    window.location.href = 'exam-test.html';
}
// Hàm hiển thị modal nhập liệu với 3 dạng đề
function openImportModal() {
    // Hiển thị modal chọn dạng đề
    // Khi chọn dạng 1 (Đáp án), Dạng 2 (Điền từ), Dạng 3 (Đọc hiểu)
    // Hệ thống sẽ hiển thị quy tắc tương ứng ở ô "Quy tắc & Ví dụ"
}

// Hàm render preview tự động theo quy tắc
function updatePreview() {
    const raw = document.getElementById('raw-exam-content').value;
    const preview = document.getElementById('preview-area');
    
    // Thuật toán nhận diện:
    // 1. Kiểm tra dòng có dấu ' -> Bắt đầu phần mới
    // 2. Nếu dòng chứa [FILL] -> Dạng Điền từ
    // 3. Nếu dòng chứa [READ-n] -> Dạng Đọc hiểu
    // 4. Nếu không thì mặc định là Dạng 1 (Đáp án đúng)
    
    // Render kết quả với màu hồng chủ đạo (sử dụng class CSS .question-card đã có)
}
// --- LOGIC NHẬN DIỆN & TẠO ĐỀ ---
function parseExamData(rawText) {
    const blocks = rawText.trim().split(/'(?=Phần)/); // Chia theo dấu nháy ' đầu phần
    let quizData = [];

    blocks.forEach(block => {
        if (!block.trim()) return;
        const lines = block.trim().split('\n');
        const header = lines[0].trim(); // Tên phần (Ví dụ: Phần 1)
        
        // Nhận diện dạng đề
        let type = 'single'; // Mặc định Dạng 1
        if (block.includes('[FILL]')) type = 'fill';
        else if (block.includes('[READ-')) type = 'read';

        // Xử lý nội dung (logic Regex đơn giản hóa)
        // Bạn có thể mở rộng logic cắt chuỗi tại đây
        quizData.push({ header, type, raw: block });
    });
    return quizData;
}

// Hàm render Preview (Hình 5, 6)
function updatePreview() {
    const content = document.getElementById('raw-exam-content').value;
    const previewArea = document.getElementById('preview-area');
    const data = parseExamData(content);
    
    previewArea.innerHTML = data.map((part, idx) => `
        <div class="question-card">
            <h4 class="font-bold text-[#ff6b81] border-b pb-2 mb-4">${part.header} - ${part.type}</h4>
            <div class="text-gray-700">${part.raw.replace(/\n/g, '<br>')}</div>
        </div>
    `).join('');
}

// Lắng nghe sự kiện để preview tự động
document.getElementById('raw-exam-content')?.addEventListener('input', updatePreview);
const EXAM_RULES = {
    single: {
        title: "Dạng 1: Đáp án đúng",
        content: "'Phần 1\n\nWhen we went back to the bookstore, the bookseller _ the book we wanted.\nA. sold\n*B. had sold\nC. sells\nD. has sold\n\n[Giải thích: Đáp án B vì...]"
    },
    fill: {
        title: "Dạng 2: Điền từ",
        content: "'Phần 3\n[FILL]Background, in relation to computers, on the screen, the color on which characters are displayed.\n\n[FILL] [Generally], only multitasking operating systems are able to support background processing."
    },
    read: {
        title: "Dạng 3: Đọc hiểu",
        content: "'Phần 4\n[READ-5] Read the following passage... (nội dung bài đọc)\n\nQuestion 1: What does the passage mainly discuss?\n*A. Reading..."
    }
};

// Hàm hiển thị quy tắc
function showRule(type) {
    const display = document.getElementById('rule-display');
    const rule = EXAM_RULES[type];
    if (rule) {
        display.innerHTML = `<h4 class="font-bold">${rule.title}</h4><pre class="text-xs whitespace-pre-wrap">${rule.content}</pre>`;
        display.dataset.currentContent = rule.content; // Lưu nội dung để copy
    }
}

// Hàm Copy nội dung
function copyRule() {
    const content = document.getElementById('rule-display').dataset.currentContent;
    if (!content) return alert("Vui lòng chọn dạng đề trước!");
    navigator.clipboard.writeText(content).then(() => alert("Đã sao chép quy tắc và ví dụ!"));
}
function addQuestion() {
    const content = document.getElementById('raw-exam-content').value;
    const previewArea = document.getElementById('preview-area');
    
    // Tạo một thẻ div mới cho câu hỏi/phần vừa thêm
    const newPart = document.createElement('div');
    newPart.className = "question-card p-6 bg-white rounded-3xl border border-[#ffe4e6] shadow-md";
    newPart.innerHTML = `<div class="text-sm text-gray-600">${content.replace(/\n/g, '<br>')}</div>`;
    
    previewArea.appendChild(newPart);
    // Xóa ô nhập để nhập câu tiếp theo
    document.getElementById('raw-exam-content').value = ''; 
}
// Hàm mở thư mục (Xử lý ẩn hiện view)
function openExamFolder(folderId) {
    currentExamFolderId = folderId;
    document.getElementById('exam-view-home').style.display = 'none';
    document.getElementById('exam-view-folder').style.display = 'block';
    
    const folder = examFolders.find(f => f.id == folderId);
    document.getElementById('current-folder-name').innerText = '📁 ' + folder.name;
    
    // Nút quay lại
    const backBtn = document.getElementById('folder-back-btn');
    backBtn.onclick = () => {
        document.getElementById('exam-view-folder').style.display = 'none';
        document.getElementById('exam-view-home').style.display = 'block';
    };
    
    renderExamQuizzes(folderId);
}
// Bắt sự kiện phím Enter cho nút "Tiếp tục" ở bảng kết quả đúng/sai
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const overlay = document.getElementById('quiz-feedback-overlay');
        
        // Kiểm tra xem bảng feedback có đang hiển thị hay không (không chứa class translate-y-full)
        if (overlay && !overlay.classList.contains('translate-y-full')) {
            e.preventDefault(); // Ngăn chặn hành vi mặc định của Enter (ví dụ: submit form)
            nextFromFeedback(); // Kích hoạt hàm chuyển câu hỏi
        }
    }
});
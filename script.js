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
                document.body.style.background = 'linear-gradient(135deg, #fdfbf7 0%, #fff0f0 50%, #f0f7ff 100%)';
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
    const list = document.getElementById('folder-list');
    if (!list) return;
    list.innerHTML = '';
    
    const rootFolders = folders.filter(f => !f.parentId);
    rootFolders.forEach(f => {
        const childFolders = folders.filter(sub => sub.parentId == f.id).length;
        const allIds = getAllFolderIds(f.id);
        const quizCount = quizzes.filter(q => allIds.includes(String(q.folderId))).length;
        
        // Thêm class h-40 để đồng bộ kích thước
list.innerHTML += `<div class="bg-white/80 backdrop-blur-sm border-2 border-[#bde0fe] rounded-3xl p-5 cursor-pointer hover:-translate-y-1 transition-transform shadow-sm flex flex-col justify-between relative group h-40" onclick="openFolder(${f.id})">            
            <!-- Nhóm nút chức năng ẩn/hiện khi hover -->
            <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition z-10">
                <button onclick="editFolderFromList(event, ${f.id})" class="w-8 h-8 rounded-full bg-[#f0f7ff] text-[#94a3b8] hover:text-[#3b82f6] hover:bg-[#dbeafe] flex items-center justify-center shadow-sm">
                    <i class="fa-solid fa-pen text-sm"></i>
                </button>
                <button onclick="deleteFolderFromList(event, ${f.id})" class="w-8 h-8 rounded-full bg-[#fff0f0] text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#ffe4e6] flex items-center justify-center shadow-sm">
                    <i class="fa-solid fa-trash-can text-sm"></i>
                </button>
            </div>

            <div>
                <h4 class="font-extrabold text-[#1e3a8a] text-lg flex items-center gap-2 pr-8"><i class="fa-solid fa-folder text-yellow-400"></i> ${f.name}</h4>
                <p class="text-[13px] text-[#475569] mt-2 line-clamp-2">${f.desc || ''}</p>
            </div>
            <div class="mt-4 flex gap-2">
                <span class="bg-[#eff6ff] text-[#3b82f6] text-[11px] font-bold px-2 py-1 rounded-lg">${childFolders} thư mục con</span>
                <span class="bg-[#ffe4e6] text-[#800020] text-[11px] font-bold px-2 py-1 rounded-lg">${quizCount} đề thi</span>
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
        
        list.innerHTML += `<div class="bg-white/80 backdrop-blur-sm border-2 border-[#bde0fe] rounded-3xl p-5 cursor-pointer hover:-translate-y-1 transition-transform shadow-sm flex flex-col justify-between relative group h-40" onclick="openFolder(${f.id})">
            
            <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition z-10">
                <button onclick="editFolderFromList(event, ${f.id})" class="w-8 h-8 rounded-full bg-[#f0f7ff] text-[#94a3b8] hover:text-[#3b82f6] hover:bg-[#dbeafe] flex items-center justify-center shadow-sm">
                    <i class="fa-solid fa-pen text-sm"></i>
                </button>
                <button onclick="deleteFolderFromList(event, ${f.id})" class="w-8 h-8 rounded-full bg-[#fff0f0] text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#ffe4e6] flex items-center justify-center shadow-sm">
                    <i class="fa-solid fa-trash-can text-sm"></i>
                </button>
            </div>

            <div>
                <h4 class="font-extrabold text-[#1e3a8a] text-lg flex items-center gap-2 pr-8"><i class="fa-solid fa-folder text-yellow-400"></i> ${f.name}</h4>
                <p class="text-[13px] text-[#475569] mt-2 line-clamp-2">${f.desc || ''}</p>
            </div>
            <div class="mt-4 flex gap-2">
                <span class="bg-[#eff6ff] text-[#3b82f6] text-[11px] font-bold px-2 py-1 rounded-lg">${childCount} thư mục con</span>
                <span class="bg-[#ffe4e6] text-[#800020] text-[11px] font-bold px-2 py-1 rounded-lg">${quizCount} đề thi</span>
            </div>
        </div>`;
    });

    // Hiển thị Đề thi
    folderQuizzes.forEach(q => {
        list.innerHTML += `<div class="bg-[#eff6ff] border-2 border-[#3b82f6] rounded-3xl p-5 cursor-pointer hover:shadow-lg transition-shadow relative group flex flex-col justify-center h-40" onclick="openQuiz(${q.id})">
            
            <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition z-10">
                <button onclick="editQuizFromList(event, ${q.id})" class="w-8 h-8 rounded-full bg-white text-[#94a3b8] hover:text-[#3b82f6] hover:bg-blue-50 flex items-center justify-center shadow-sm">
                    <i class="fa-solid fa-pen text-sm"></i>
                </button>
                <button onclick="deleteQuizFromList(event, ${q.id})" class="w-8 h-8 rounded-full bg-white text-[#94a3b8] hover:text-[#ef4444] hover:bg-red-50 flex items-center justify-center shadow-sm">
                    <i class="fa-solid fa-trash-can text-sm"></i>
                </button>
            </div>

            <h4 class="font-extrabold text-[#1e3a8a] text-lg pr-8"><i class="fa-solid fa-file-lines text-blue-500 mr-2"></i> ${q.name}</h4>
            <p class="text-[#3b82f6] text-sm font-bold mt-3">${q.questions.length} Câu hỏi</p>
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
    const blocks = rawText.trim().split(/\n\s*\n/);
    let parsedQuestions = [];

    blocks.forEach((block, index) => {
        const lines = block.split('\n').map(l => l.trim()).filter(l => l !== "");
        if (lines.length < 2) return;

        let questionText = "";
        let options = [];
        let explanation = ""; 
        let correctAnswerIndex = -1;
        let isReadingOptions = false; 

        lines.forEach(line => {
            if (line.startsWith("[") && line.endsWith("]") && line !== "[br]") {
                explanation = line.substring(1, line.length - 1).trim();
                return; 
            }

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
                questionText += (questionText ? "<br>" : "") + line.replace(/\[br\]/g, '<br>');
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
    
    localStorage.setItem('tempTest', JSON.stringify(finalQuestions));
    localStorage.setItem('tempTestContext', JSON.stringify(testContext));
    localStorage.removeItem('isReviewMode');

    window.location.href = 'grammar-test.html'; 
}

// ==========================================
// 7. LOGIC XỬ LÝ LÀM BÀI (GRAMMAR-TEST.HTML)
// ==========================================
function initTest() {
    const savedData = localStorage.getItem('tempTest');
    if (!savedData) return;
    currentTestQuestions = JSON.parse(savedData);

    const isReview = localStorage.getItem('isReviewMode') === 'true';

    if (isReview) {
        userAnswers = JSON.parse(localStorage.getItem('tempReviewAnswers')) || {};
        renderTestQuestions();
        applyReviewState(); 
    } else {
        userAnswers = {};
        renderTestQuestions();
        updateProgress();
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
                    <div class="w-10 h-10 shrink-0 bg-[#bde0fe] text-[#1e3a8a] font-extrabold rounded-full flex items-center justify-center text-lg" id="q-num-${qIndex}">${qIndex + 1}</div>
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

    localStorage.removeItem('isReviewMode'); 
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
            <div onclick="window.location.href='grammar.html'" class="min-w-[260px] w-[260px] shrink-0 snap-start bg-white/80 backdrop-blur-sm border-2 border-[#bde0fe] rounded-2xl p-4 flex flex-col h-36 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden group">
                <div class="absolute -right-4 -bottom-4 text-6xl text-blue-100 opacity-50 group-hover:scale-110 transition-transform z-0"><i class="fa-solid fa-book-bookmark"></i></div>
                <h4 class="font-extrabold text-[#1e3a8a] text-[15px] leading-tight mb-1 flex items-center gap-2 relative z-10"><i class="fa-solid fa-folder text-yellow-400"></i> ${f.name}</h4>
                <p class="text-[11px] text-[#475569] mb-3 line-clamp-2 relative z-10 font-semibold">${f.desc || 'Không có mô tả'}</p>
                <div class="mt-auto flex items-center gap-2 relative z-10">
                    <span class="bg-[#eff6ff] text-[#3b82f6] text-[10px] font-extrabold px-2 py-1 rounded-lg border border-blue-100">${childCount} Thư mục con</span>
                    <span class="bg-[#ffe4e6] text-[#800020] text-[10px] font-extrabold px-2 py-1 rounded-lg border border-red-100">${quizCount} Đề thi</span>
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
            <div onclick="reviewHistory(${item.date})" class="bg-[#f8fafc] border border-[#e2e8f0] rounded-[24px] p-3 pr-6 flex items-center gap-4 hover:border-[#bde0fe] hover:bg-white transition-all shadow-sm cursor-pointer">
                <div class="w-[42px] h-[42px] rounded-full bg-[#ffe4e6] flex items-center justify-center text-[#800020] text-lg shrink-0 border border-[#fbc3cb]">
                    <i class="fa-solid fa-clipboard-check"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-[#1e3a8a] font-extrabold text-[15px] truncate leading-tight mb-0.5">${item.name}</h4>
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
        <div class="bg-white border-2 border-[#bde0fe] rounded-[24px] p-5 cursor-pointer hover:-translate-y-1 transition-transform shadow-sm flex flex-col justify-between relative group h-40" onclick="openVocabFolder(${f.id})">
            
            <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition z-10">
                <button onclick="editVocabFolderFromList(event, ${f.id})" class="w-8 h-8 rounded-full bg-[#f0f7ff] text-[#94a3b8] hover:text-[#3b82f6] hover:bg-[#dbeafe] flex items-center justify-center shadow-sm">
                    <i class="fa-solid fa-pen text-sm"></i>
                </button>
                <button onclick="deleteVocabFolderFromList(event, ${f.id})" class="w-8 h-8 rounded-full bg-[#fff0f0] text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#ffe4e6] flex items-center justify-center shadow-sm">
                    <i class="fa-solid fa-trash-can text-sm"></i>
                </button>
            </div>

            <h4 class="font-extrabold text-[#1e3a8a] text-[17px] flex items-center gap-2"><i class="fa-solid fa-folder text-yellow-400 text-xl"></i> ${f.name}</h4>
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
        <div class="bg-white border-2 border-[#bde0fe] rounded-[24px] p-5 cursor-pointer hover:-translate-y-1 transition-transform shadow-sm flex flex-col justify-between relative group h-40" onclick="openVocabFolder(${f.id})">
            
            <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition z-10">
                <button onclick="editVocabFolderFromList(event, ${f.id})" class="w-8 h-8 rounded-full bg-[#f0f7ff] text-[#94a3b8] hover:text-[#3b82f6] hover:bg-[#dbeafe] flex items-center justify-center shadow-sm">
                    <i class="fa-solid fa-pen text-sm"></i>
                </button>
                <button onclick="deleteVocabFolderFromList(event, ${f.id})" class="w-8 h-8 rounded-full bg-[#fff0f0] text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#ffe4e6] flex items-center justify-center shadow-sm">
                    <i class="fa-solid fa-trash-can text-sm"></i>
                </button>
            </div>

            <h4 class="font-extrabold text-[#1e3a8a] text-[17px] flex items-center gap-2"><i class="fa-solid fa-folder text-yellow-400 text-xl"></i> ${f.name}</h4>
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
        <div class="bg-white/90 p-6 rounded-[24px] shadow-sm border border-[#e2e8f0] relative group transition-all hover:border-[#bde0fe] vocab-card-item">
            <div class="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                <span class="font-extrabold text-xl text-[#1e3a8a] card-number-label"></span>
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
// 14. GAME FLASHCARD LOGIC
// ==========================================
let fcVocab = []; // Chuyển thành mảng trống, dữ liệu sẽ nạp tự động khi mở game
let fcCurrentIndex = 0;
let fcIsFlipped = false;

function openFlashcardGame() {
    // 1. Gom toàn bộ từ vựng từ vocabSets (LocalStorage)
    fcVocab = [];
    vocabSets.forEach(set => {
        if (set.words && set.words.length > 0) {
            set.words.forEach(w => {
                fcVocab.push({
                    word: w.term || 'Chưa có thuật ngữ',
                    type: w.wordType || '',
                    pronunciation: w.pronunciation || '',
                    meaning: w.definition || 'Chưa có định nghĩa',
                    example: w.example || ''
                });
            });
        }
    });

    // 2. Kiểm tra nếu chưa có từ vựng nào
    if (fcVocab.length === 0) {
        alert("Bạn chưa có từ vựng nào để chơi! Hãy vào mục 'Bộ từ vựng' tạo thêm nhé.");
        return;
    }

    // 3. (Tùy chọn) Xáo trộn ngẫu nhiên thứ tự từ vựng để học không bị nhàm chán
    fcVocab.sort(() => Math.random() - 0.5);

    // 4. Mở cửa sổ Game
    const modal = document.getElementById('flashcard-game-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    fcCurrentIndex = 0;
    fcIsFlipped = false; // Đảm bảo thẻ luôn úp ở mặt tiếng Anh khi mới mở
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
    fcCurrentIndex = (fcCurrentIndex + 1) % fcVocab.length;
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

// Lắng nghe phím tắt nhưng CHỈ KHI cửa sổ game đang mở
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
// 15. GIAO DIỆN CHỌN CHẾ ĐỘ GAME TRẮC NGHIỆM
// ==========================================

function openQuizModeModal() {
    const modal = document.getElementById('quiz-mode-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeQuizModeModal() {
    const modal = document.getElementById('quiz-mode-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function startQuizMode(mode) {
    // Tạm thời hiển thị thông báo, sau này bạn có thể gọi logic game thật ở đây
    let modeName = "";
    if (mode === 'tu_nghia') modeName = "Từ -> Nghĩa";
    if (mode === 'ngu_canh') modeName = "Ngữ cảnh";
    if (mode === 'nghia_tu') modeName = "Nghĩa -> Từ";
    
    alert(`Bạn đã chọn chế độ: ${modeName}. Tính năng đang được phát triển!`);
    closeQuizModeModal();
}
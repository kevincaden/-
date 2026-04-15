// ==========================================
// 核心配置 (全局唯一声明，防止重复定义报错)
// ==========================================
const CONFIG = {
    BASE_URL: "https://api.sheetbest.com/sheets/87572aa7-279a-4a0d-82b6-6ed615c0f9b7",
    TABS: {
        USERS: "/tabs/users",
        GIFTS: "/tabs/gifts",
        HISTORIES: "/tabs/histories"
    }
};

let currentUser = null;

// ==========================================
// 初始化与事件绑定
// ==========================================
window.onload = () => {
    console.log("程序已启动，正在检查本地会话...");
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (loginBtn) loginBtn.onclick = login;
    if (logoutBtn) logoutBtn.onclick = logout;

    checkLocalSession();
};

// ==========================================
// 1. 增强版登录逻辑
// ==========================================
async function login() {
    // 获取输入并去除前后空格
    const userInp = document.getElementById('login-username').value.trim();
    const passInp = document.getElementById('login-password').value.trim();
    
    if (!userInp || !passInp) return alert("请输入用户名和密码");

    showLoading(true);
    try {
        const res = await fetch(CONFIG.BASE_URL + CONFIG.TABS.USERS);
        const users = await res.json();
        
        // 【关键调试日志】在控制台输出原始数据，方便排查列名或格式问题
        console.log("从表格获取到的原始用户列表:", users);
        
        // 增强容错匹配：转字符串、去空格、匹配字段
        const user = users.find(u => {
            const dbUser = (u.username || "").toString().trim();
            const dbPass = (u.password || "").toString().trim();
            return dbUser === userInp && dbPass === passInp;
        });
        
        if (user) {
            console.log("登录成功，用户信息:", user);
            // 兼容多种 TRUE 格式的判断
            const isAdminValue = (user.is_admin || "").toString().toUpperCase().trim();
            user.is_admin = (isAdminValue === "TRUE" || user.is_admin === true);
            
            currentUser = user;
            localStorage.setItem('reward_user', JSON.stringify(user));
            renderUI();
        } else {
            alert("用户名或密码不匹配，请检查控制台数据输出。");
        }
    } catch (e) {
        console.error("登录请求出错:", e);
        alert("连接服务器失败，请确认 VPN 状态或 API 额度。");
    } finally {
        showLoading(false);
    }
}

// ==========================================
// 2. 界面渲染逻辑
// ==========================================
async function renderUI() {
    if (!currentUser) return;

    // UI 元素显示切换
    const loginBox = document.getElementById('login-container');
    const mainBox = document.getElementById('main-content');
    const logoutBtn = document.getElementById('logout-btn');
    const userDisplay = document.getElementById('user-display');

    if (loginBox) loginBox.classList.add('hidden');
    if (mainBox) mainBox.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    
    if (userDisplay) {
        userDisplay.innerText = `${currentUser.username} (积分: ${currentUser.points})`;
    }

    // 管理员权限 UI 显隐
    if (currentUser.is_admin) {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    }

    await loadGifts();
}

// ==========================================
// 3. 礼品加载
// ==========================================
async function loadGifts() {
    const listEl = document.getElementById('gift-list');
    if (!listEl) return;
    
    listEl.innerHTML = "<p class='col-span-full text-center'>正在获取礼品清单...</p>";
    
    try {
        const res = await fetch(CONFIG.BASE_URL + CONFIG.TABS.GIFTS);
        const gifts = await res.json();
        console.log("礼品列表已更新:", gifts);
        
        listEl.innerHTML = "";
        gifts.forEach(gift => {
            const card = `
                <div class="bg-white p-4 rounded shadow hover:shadow-lg transition">
                    <img src="${gift.image}" class="w-full h-40 object-cover mb-4 rounded bg-gray-100">
                    <h3 class="font-bold text-lg">${gift.name}</h3>
                    <p class="text-blue-600 font-bold">${gift.points} 积分</p>
                    <p class="text-sm text-gray-500">库存: ${gift.stock}</p>
                    <button onclick="exchange('${gift.name}', ${gift.points}, ${gift.stock})" 
                            class="mt-4 w-full bg-orange-500 text-white py-1 rounded hover:bg-orange-600">
                        立即兑换
                    </button>
                    ${currentUser.is_admin ? 
                        `<button onclick="adminEditGift('${gift.id}')" class="mt-2 w-full border border-gray-300 py-1 rounded text-sm text-gray-600 hover:bg-gray-50">编辑礼品</button>` : ''}
                </div>
            `;
            listEl.insertAdjacentHTML('beforeend', card);
        });
    } catch (e) {
        listEl.innerHTML = "<p class='col-span-full text-center text-red-500'>礼品加载失败，请刷新重试。</p>";
    }
}

// ==========================================
// 4. 管理员同步逻辑 (修正后的路径格式)
// ==========================================
async function adminEditGift(giftId) {
    const newName = prompt("【管理员操作】输入新的礼品名称:");
    if (!newName) return;

    showLoading(true);
    // 修正路径：BASE_URL + /tabs/表名/匹配列名/匹配值
    const syncUrl = `${CONFIG.BASE_URL}${CONFIG.TABS.GIFTS}/id/${giftId}`;
    
    try {
        const response = await fetch(syncUrl, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName })
        });
        
        if (response.ok) {
            alert("修改已同步至 Google 表格！");
            await loadGifts();
        } else {
            throw new Error("同步失败");
        }
    } catch (e) {
        alert("同步到后端出错，请检查 API 权限设置。");
    } finally {
        showLoading(false);
    }
}

// ==========================================
// 5. 辅助函数
// ==========================================
function showLoading(show) {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.style.display = show ? 'block' : 'none';
}

function checkLocalSession() {
    const saved = localStorage.getItem('reward_user');
    if (saved) {
        currentUser = JSON.parse(saved);
        console.log("检测到已登录用户:", currentUser.username);
        renderUI();
    }
}

function logout() {
    localStorage.removeItem('reward_user');
    console.log("用户已退出");
    location.reload();
}// ==========================================
// 核心配置 (全局唯一声明，防止重复定义报错)
// ==========================================
const CONFIG = {
    BASE_URL: "https://api.sheetbest.com/sheets/87572aa7-279a-4a0d-82b6-6ed615c0f9b7",
    TABS: {
        USERS: "/tabs/users",
        GIFTS: "/tabs/gifts",
        HISTORIES: "/tabs/histories"
    }
};

let currentUser = null;

// ==========================================
// 初始化与事件绑定
// ==========================================
window.onload = () => {
    console.log("程序已启动，正在检查本地会话...");
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (loginBtn) loginBtn.onclick = login;
    if (logoutBtn) logoutBtn.onclick = logout;

    checkLocalSession();
};

// ==========================================
// 1. 增强版登录逻辑
// ==========================================
async function login() {
    // 获取输入并去除前后空格
    const userInp = document.getElementById('login-username').value.trim();
    const passInp = document.getElementById('login-password').value.trim();
    
    if (!userInp || !passInp) return alert("请输入用户名和密码");

    showLoading(true);
    try {
        const res = await fetch(CONFIG.BASE_URL + CONFIG.TABS.USERS);
        const users = await res.json();
        
        // 【关键调试日志】在控制台输出原始数据，方便排查列名或格式问题
        console.log("从表格获取到的原始用户列表:", users);
        
        // 增强容错匹配：转字符串、去空格、匹配字段
        const user = users.find(u => {
            const dbUser = (u.username || "").toString().trim();
            const dbPass = (u.password || "").toString().trim();
            return dbUser === userInp && dbPass === passInp;
        });
        
        if (user) {
            console.log("登录成功，用户信息:", user);
            // 兼容多种 TRUE 格式的判断
            const isAdminValue = (user.is_admin || "").toString().toUpperCase().trim();
            user.is_admin = (isAdminValue === "TRUE" || user.is_admin === true);
            
            currentUser = user;
            localStorage.setItem('reward_user', JSON.stringify(user));
            renderUI();
        } else {
            alert("用户名或密码不匹配，请检查控制台数据输出。");
        }
    } catch (e) {
        console.error("登录请求出错:", e);
        alert("连接服务器失败，请确认 VPN 状态或 API 额度。");
    } finally {
        showLoading(false);
    }
}

// ==========================================
// 2. 界面渲染逻辑
// ==========================================
async function renderUI() {
    if (!currentUser) return;

    // UI 元素显示切换
    const loginBox = document.getElementById('login-container');
    const mainBox = document.getElementById('main-content');
    const logoutBtn = document.getElementById('logout-btn');
    const userDisplay = document.getElementById('user-display');

    if (loginBox) loginBox.classList.add('hidden');
    if (mainBox) mainBox.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    
    if (userDisplay) {
        userDisplay.innerText = `${currentUser.username} (积分: ${currentUser.points})`;
    }

    // 管理员权限 UI 显隐
    if (currentUser.is_admin) {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    }

    await loadGifts();
}

// ==========================================
// 3. 礼品加载
// ==========================================
async function loadGifts() {
    const listEl = document.getElementById('gift-list');
    if (!listEl) return;
    
    listEl.innerHTML = "<p class='col-span-full text-center'>正在获取礼品清单...</p>";
    
    try {
        const res = await fetch(CONFIG.BASE_URL + CONFIG.TABS.GIFTS);
        const gifts = await res.json();
        console.log("礼品列表已更新:", gifts);
        
        listEl.innerHTML = "";
        gifts.forEach(gift => {
            const card = `
                <div class="bg-white p-4 rounded shadow hover:shadow-lg transition">
                    <img src="${gift.image}" class="w-full h-40 object-cover mb-4 rounded bg-gray-100">
                    <h3 class="font-bold text-lg">${gift.name}</h3>
                    <p class="text-blue-600 font-bold">${gift.points} 积分</p>
                    <p class="text-sm text-gray-500">库存: ${gift.stock}</p>
                    <button onclick="exchange('${gift.name}', ${gift.points}, ${gift.stock})" 
                            class="mt-4 w-full bg-orange-500 text-white py-1 rounded hover:bg-orange-600">
                        立即兑换
                    </button>
                    ${currentUser.is_admin ? 
                        `<button onclick="adminEditGift('${gift.id}')" class="mt-2 w-full border border-gray-300 py-1 rounded text-sm text-gray-600 hover:bg-gray-50">编辑礼品</button>` : ''}
                </div>
            `;
            listEl.insertAdjacentHTML('beforeend', card);
        });
    } catch (e) {
        listEl.innerHTML = "<p class='col-span-full text-center text-red-500'>礼品加载失败，请刷新重试。</p>";
    }
}

// ==========================================
// 4. 管理员同步逻辑 (修正后的路径格式)
// ==========================================
async function adminEditGift(giftId) {
    const newName = prompt("【管理员操作】输入新的礼品名称:");
    if (!newName) return;

    showLoading(true);
    // 修正路径：BASE_URL + /tabs/表名/匹配列名/匹配值
    const syncUrl = `${CONFIG.BASE_URL}${CONFIG.TABS.GIFTS}/id/${giftId}`;
    
    try {
        const response = await fetch(syncUrl, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName })
        });
        
        if (response.ok) {
            alert("修改已同步至 Google 表格！");
            await loadGifts();
        } else {
            throw new Error("同步失败");
        }
    } catch (e) {
        alert("同步到后端出错，请检查 API 权限设置。");
    } finally {
        showLoading(false);
    }
}

// ==========================================
// 5. 辅助函数
// ==========================================
function showLoading(show) {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.style.display = show ? 'block' : 'none';
}

function checkLocalSession() {
    const saved = localStorage.getItem('reward_user');
    if (saved) {
        currentUser = JSON.parse(saved);
        console.log("检测到已登录用户:", currentUser.username);
        renderUI();
    }
}

function logout() {
    localStorage.removeItem('reward_user');
    console.log("用户已退出");
    location.reload();
}

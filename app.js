// 配置信息 (保持你的 Sheet.best 配置不变)
const CONFIG = {
    BASE_URL: "https://api.sheetbest.com/sheets/87572aa7-279a-4a0d-82b6-6ed615c0f9b7",
    TABS: {
        USERS: "/tabs/users",
        GIFTS: "/tabs/gifts",
        HISTORIES: "/tabs/histories"
    }
};

let currentUser = null;
let syncInterval = null; // 用于存储定时器

// 页面加载完成后的初始化
window.onload = () => {
    bindEvents();
    checkLocalSession();
    
    // 开启多设备后台同步：每 15 秒静默刷新一次礼品列表 (仅在登录后执行)
    syncInterval = setInterval(() => {
        if (currentUser) {
            loadGifts(true); // 传入 true 表示静默加载，不显示 Loading 动画
        }
    }, 15000);
};

function bindEvents() {
    document.getElementById('login-btn').onclick = login;
    document.getElementById('logout-btn').onclick = logout;
}

// 1. 登录逻辑
async function login() {
    const userInp = document.getElementById('login-username').value;
    const passInp = document.getElementById('login-password').value;
    
    showLoading(true);
    try {
        const res = await fetch(CONFIG.BASE_URL + CONFIG.TABS.USERS);
        const users = await res.json();
        
        const user = users.find(u => u.username === userInp && u.password === passInp);
        
        if (user) {
            currentUser = user;
            localStorage.setItem('reward_user', JSON.stringify(user));
            renderUI();
        } else {
            alert("用户名或密码错误");
        }
    } catch (e) {
        alert("连接服务器失败，请检查网络或 API 额度");
    } finally {
        showLoading(false);
    }
}

// 2. 界面渲染
function renderUI() {
    if (!currentUser) return;

    // 切换容器显示
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    document.getElementById('logout-btn').classList.remove('hidden');
    
    // 显示用户信息
    document.getElementById('user-display').innerText = `${currentUser.username} (积分: ${currentUser.points})`;

    // 管理员权限检查
    if (currentUser.is_admin === "TRUE") {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    }

    loadGifts(false); // 正常加载礼品列表
}

// 3. 加载礼品 (新增 silent 参数，用于控制是否显示加载提示，避免打扰用户)
async function loadGifts(silent = false) {
    const listEl = document.getElementById('gift-list');
    if (!silent) {
        listEl.innerHTML = "<p class='col-span-full text-center text-gray-500'>加载中...</p>";
    }
    
    try {
        const res = await fetch(CONFIG.BASE_URL + CONFIG.TABS.GIFTS);
        const gifts = await res.json();
        
        // 生成新的 HTML 内容
        let newHtml = "";
        gifts.forEach(gift => {
            const card = `
                <div class="bg-white p-4 rounded shadow hover:shadow-lg transition">
                    <img src="${gift.image}" class="w-full h-40 object-cover mb-4 rounded" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                    <h3 class="font-bold text-lg">${gift.name}</h3>
                    <p class="text-blue-600 font-bold">${gift.points} 积分</p>
                    <p class="text-sm text-gray-500 mb-2">库存: ${gift.stock}</p>
                    <button onclick="exchange('${gift.name}', ${gift.points}, ${gift.stock})" 
                            class="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition">
                        兑换
                    </button>
                    ${currentUser.is_admin === "TRUE" ? 
                        `<div class="flex gap-2 mt-3">
                            <button onclick="adminEditGift('${gift.id}')" class="flex-1 border border-gray-300 py-1 rounded text-sm text-gray-600 hover:bg-gray-50 transition">编辑</button>
                            <button onclick="adminDeleteGift('${gift.id}')" class="flex-1 border border-red-300 bg-red-50 py-1 rounded text-sm text-red-600 hover:bg-red-100 transition">删除</button>
                        </div>` : ''}
                </div>
            `;
            newHtml += card;
        });
        
        // 只有当获取成功后，才一次性替换页面内容，防止页面闪烁
        listEl.innerHTML = newHtml;
    } catch (e) {
        if (!silent) listEl.innerHTML = "<p class='text-red-500 col-span-full text-center'>礼品加载失败，请刷新重试</p>";
    }
}

// 4. 核心兑换与同步逻辑 (已补全扣减库存逻辑)
async function exchange(giftName, cost, stock) {
    if (parseInt(currentUser.points) < cost) return alert("积分不足！");
    if (parseInt(stock) <= 0) return alert("库存不足！");

    const newPoints = parseInt(currentUser.points) - cost;
    showLoading(true);

    try {
        // A. 更新用户积分 (同步到 Google 表格)
        await fetch(`${CONFIG.BASE_URL}${CONFIG.TABS.USERS}/username/${currentUser.username}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ points: newPoints })
        });

        // B. 写入兑换记录
        await fetch(CONFIG.BASE_URL + CONFIG.TABS.HISTORIES, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: currentUser.username,
                gift_name: giftName,
                cost: cost,
                date: new Date().toLocaleString()
            })
        });

        // C. 更新礼品库存 (库存减 1)
        const newStock = parseInt(stock) - 1;
        await fetch(`${CONFIG.BASE_URL}${CONFIG.TABS.GIFTS}/name/${giftName}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stock: newStock })
        });

        alert("兑换成功！");
        // 更新本地变量和缓存
        currentUser.points = newPoints;
        localStorage.setItem('reward_user', JSON.stringify(currentUser)); 
        
        renderUI(); // 刷新界面
    } catch (e) {
        alert("同步数据失败，请检查网络");
    } finally {
        showLoading(false);
    }
}

// 5. 管理员修改礼品名称
async function adminEditGift(giftId) {
    const newName = prompt("输入新的礼品名称:");
    if (!newName) return;

    showLoading(true);
    try {
        await fetch(`${CONFIG.BASE_URL}${CONFIG.TABS.GIFTS}/id/${giftId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName })
        });
        alert("修改已同步至云端");
        loadGifts(false); // 强制刷新并显示加载提示
    } catch (e) {
        alert("管理员同步失败");
    } finally {
        showLoading(false);
    }
}

// 6. 管理员删除礼品 (新增)
async function adminDeleteGift(giftId) {
    if (!confirm("确定要下架并删除这个礼品吗？此操作不可恢复。")) return;

    showLoading(true);
    try {
        await fetch(`${CONFIG.BASE_URL}${CONFIG.TABS.GIFTS}/id/${giftId}`, {
            method: "DELETE"
        });
        alert("礼品已删除！");
        loadGifts(false); // 强制刷新并显示加载提示
    } catch (e) {
        alert("删除失败，请检查网络");
    } finally {
        showLoading(false);
    }
}

// 通用辅助函数
function showLoading(show) {
    document.getElementById('loading-spinner').style.display = show ? 'block' : 'none';
}

function checkLocalSession() {
    const saved = localStorage.getItem('reward_user');
    if (saved) {
        currentUser = JSON.parse(saved);
        renderUI();
    }
}

function logout() {
    localStorage.removeItem('reward_user');
    if(syncInterval) clearInterval(syncInterval); // 清除定时器
    location.reload();
}
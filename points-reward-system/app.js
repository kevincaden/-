// 配置信息
const CONFIG = {
    BASE_URL: "https://api.sheetbest.com/sheets/87572aa7-279a-4a0d-82b6-6ed615c0f9b7",
    TABS: {
        USERS: "/tabs/users",
        GIFTS: "/tabs/gifts",
        HISTORIES: "/tabs/histories"
    }
};

let currentUser = null;

// 页面加载完成后的初始化
window.onload = () => {
    bindEvents();
    checkLocalSession();
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
async function renderUI() {
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

    await loadGifts();
}

// 3. 加载礼品
async function loadGifts() {
    const listEl = document.getElementById('gift-list');
    listEl.innerHTML = "加载中...";
    
    try {
        const res = await fetch(CONFIG.BASE_URL + CONFIG.TABS.GIFTS);
        const gifts = await res.json();
        
        listEl.innerHTML = "";
        gifts.forEach(gift => {
            const card = `
                <div class="bg-white p-4 rounded shadow hover:shadow-lg transition">
                    <img src="${gift.image}" class="w-full h-40 object-cover mb-4 rounded">
                    <h3 class="font-bold text-lg">${gift.name}</h3>
                    <p class="text-blue-600 font-bold">${gift.points} 积分</p>
                    <p class="text-sm text-gray-500">库存: ${gift.stock}</p>
                    <button onclick="exchange('${gift.name}', ${gift.points}, ${gift.stock})" 
                            class="mt-4 w-full bg-orange-500 text-white py-1 rounded hover:bg-orange-600">
                        兑换
                    </button>
                    ${currentUser.is_admin === "TRUE" ? 
                        `<button onclick="adminEditGift('${gift.id}')" class="mt-2 w-full border border-gray-300 py-1 rounded text-sm text-gray-600">编辑(管理员)</button>` : ''}
                </div>
            `;
            listEl.insertAdjacentHTML('beforeend', card);
        });
    } catch (e) {
        listEl.innerHTML = "礼品加载失败";
    }
}

// 4. 核心兑换与同步逻辑
async function exchange(giftName, cost, stock) {
    if (parseInt(currentUser.points) < cost) return alert("积分不足！");
    if (parseInt(stock) <= 0) return alert("库存不足！");

    const newPoints = parseInt(currentUser.points) - cost;
    showLoading(true);

    try {
        // A. 更新用户积分 (同步到 Google 表格)
        // 注意：Sheet.best 默认通过索引更新，这里假设通过用户名匹配
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

        alert("兑换成功！");
        currentUser.points = newPoints;
        renderUI(); // 刷新界面
    } catch (e) {
        alert("同步数据失败");
    } finally {
        showLoading(false);
    }
}

// 管理员修改示例（同步到后端）
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
        loadGifts();
    } catch (e) {
        alert("管理员同步失败");
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
    location.reload();
}
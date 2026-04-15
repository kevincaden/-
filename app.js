// Sheet.best API configuration
const SHEETBEST_CONFIG = {
    API_URL: 'https://api.sheetbest.com/sheets/87572aa7-279a-4a0d-82b6-6ed615c0f9b7',
    ENDPOINTS: {
        USERS: '/tabs/users',
        GIFTS: '/tabs/gifts',
        HISTORIES: '/tabs/histories'
    }
};

// 默认占位图
const DEFAULT_PLACEHOLDER = 'placeholder.png';

// 全局变量
let currentUser = null;
let users = [];
let gifts = [];
let redemptions = [];
let pointsHistory = [];

// 初始化应用
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 初始化数据
        await initData();
        
        // 绑定事件
        bindEvents();
        
        // 检查登录状态
        checkLoginStatus();
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('error', '初始化失败', '应用初始化失败，请刷新页面重试');
    }
});

// 初始化数据
async function initData() {
    try {
        // 获取用户数据
        const usersResponse = await fetch(SHEETBEST_CONFIG.API_URL + SHEETBEST_CONFIG.ENDPOINTS.USERS);
        if (!usersResponse.ok) {
            throw new Error(`Failed to fetch users: ${usersResponse.statusText}`);
        }
        const usersData = await usersResponse.json();
        users = usersData.map(user => ({
            id: user.id || (users.length + 1).toString(),
            username: user.username,
            password: user.password,
            points: parseInt(user.points) || 0,
            is_admin: user.is_admin === 'true' || user.is_admin === true,
            role: user.is_admin === 'true' || user.is_admin === true ? 'admin' : 'user'
        }));
        
        // 获取礼品数据
        const giftsResponse = await fetch(SHEETBEST_CONFIG.API_URL + SHEETBEST_CONFIG.ENDPOINTS.GIFTS);
        if (!giftsResponse.ok) {
            throw new Error(`Failed to fetch gifts: ${giftsResponse.statusText}`);
        }
        const giftsData = await giftsResponse.json();
        gifts = giftsData.map(gift => ({
            id: gift.id || (gifts.length + 1).toString(),
            name: gift.name,
            image: gift.image,
            points: parseInt(gift.points) || 0,
            stock: parseInt(gift.stock) || 0,
            status: parseInt(gift.stock) > 0 ? 'available' : 'unavailable'
        }));
        
        // 获取历史记录数据
        const historiesResponse = await fetch(SHEETBEST_CONFIG.API_URL + SHEETBEST_CONFIG.ENDPOINTS.HISTORIES);
        if (!historiesResponse.ok) {
            throw new Error(`Failed to fetch histories: ${historiesResponse.statusText}`);
        }
        const historiesData = await historiesResponse.json();
        redemptions = historiesData.map(history => ({
            id: history.id || (redemptions.length + 1).toString(),
            userId: history.user_id,
            giftName: history.gift_name,
            points: parseInt(history.points_spent) || 0,
            status: 'completed',
            createDate: history.date
        }));
        
        // 生成积分历史记录
        pointsHistory = redemptions.map(redemption => ({
            id: redemption.id,
            userId: redemption.userId,
            type: 'redeem',
            amount: redemption.points,
            description: `兑换礼品: ${redemption.giftName}`,
            date: redemption.createDate
        }));
        
        console.log('Data initialized successfully');
    } catch (error) {
        console.error('Error initializing data:', error);
        // 使用默认数据
        useDefaultData();
        showToast('warning', '数据加载提示', '无法连接到服务器，使用本地默认数据');
    }
}

// 使用默认数据
function useDefaultData() {
    // 创建默认管理员账户
    const admin = {
        id: '1',
        username: 'admin',
        password: 'admin123',
        points: 0,
        is_admin: true,
        role: 'admin'
    };
    
    // 创建示例用户
    const user1 = {
        id: '2',
        username: 'user1',
        password: 'user123',
        points: 100,
        is_admin: false,
        role: 'user'
    };
    
    // 保存用户数据
    users = [admin, user1];
    
    // 创建示例礼品
    gifts = [
        // 初级礼品 (25-50积分)
        {
            id: '1',
            name: '时尚U盘',
            image: 'https://p26-doubao-search-sign.byteimg.com/labis/image/ca0729e5ac6ce52a357a7d40699e3347~tplv-be4g95zd3a-image.jpeg?lk3s=feb11e32&x-expires=1791122534&x-signature=G50V4LRFxlYFJB4dnwwGhIkWOfY%3D',
            points: 30,
            stock: 20,
            status: 'available'
        },
        {
            id: '2',
            name: '精美陶瓷摆件',
            image: 'https://p3-doubao-search-sign.byteimg.com/labis/08a57cd753724d7f17f8f35e6c4f85be~tplv-be4g95zd3a-image.jpeg?lk3s=feb11e32&x-expires=1791122534&x-signature=BfkQ03nIiakt1VVAFmCDrrNVyIw%3D',
            points: 40,
            stock: 15,
            status: 'available'
        },
        {
            id: '3',
            name: '蓝牙音箱',
            image: 'https://p3-doubao-search-sign.byteimg.com/labis/27a87d5ce6419724f54053c226de63b1~tplv-be4g95zd3a-image.jpeg?lk3s=feb11e32&x-expires=1791122534&x-signature=4ZwGcLZmF4cOEDRLbrHo8NwSIrA%3D',
            points: 50,
            stock: 12,
            status: 'available'
        },
        
        // 中级礼品 (50-75积分)
        {
            id: '4',
            name: '无线蓝牙耳机',
            image: 'https://p3-doubao-search-sign.byteimg.com/labis/45469984bfc74f2f039cbcd4fa251c00~tplv-be4g95zd3a-image.jpeg?lk3s=feb11e32&x-expires=1791122534&x-signature=nzzeFVXIIj%2B0SxRMDiDkgvX9miE%3D',
            points: 60,
            stock: 10,
            status: 'available'
        },
        {
            id: '5',
            name: '木质工艺品',
            image: 'https://p11-doubao-search-sign.byteimg.com/labis/image/4a2796197fe4486b9e6575ac33950eeb~tplv-be4g95zd3a-image.jpeg?lk3s=feb11e32&x-expires=1791122534&x-signature=SHtryLuFQW2ej%2BxciDoy6V4Jyu0%3D',
            points: 70,
            stock: 8,
            status: 'available'
        },
        {
            id: '6',
            name: '智能手环',
            image: 'https://p26-doubao-search-sign.byteimg.com/isp-i18n-media/image/59c0acaa1de570e460429cc14e4c3919~tplv-be4g95zd3a-image.jpeg?lk3s=feb11e32&x-expires=1791122534&x-signature=Obng3qCaaVJ%2B4hLOcXBOCXedVoI%3D',
            points: 75,
            stock: 5,
            status: 'available'
        },
        
        // 高级礼品 (75-100积分)
        {
            id: '7',
            name: '智能手表',
            image: 'https://p3-doubao-search-sign.byteimg.com/labis/45469984bfc74f2f039cbcd4fa251c00~tplv-be4g95zd3a-image.jpeg?lk3s=feb11e32&x-expires=1791122534&x-signature=nzzeFVXIIj%2B0SxRMDiDkgvX9miE%3D',
            points: 85,
            stock: 3,
            status: 'available'
        },
        {
            id: '8',
            name: '平板电脑',
            image: 'https://p26-doubao-search-sign.byteimg.com/isp-i18n-media/image/59c0acaa1de570e460429cc14e4c3919~tplv-be4g95zd3a-image.jpeg?lk3s=feb11e32&x-expires=1791122534&x-signature=Obng3qCaaVJ%2B4hLOcXBOCXedVoI%3D',
            points: 100,
            stock: 2,
            status: 'available'
        }
    ];
    
    // 初始化兑换记录
    redemptions = [];
    pointsHistory = [];
}

// 绑定事件
function bindEvents() {
    // 登录/注册表单切换
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');
    
    if (loginTab) loginTab.addEventListener('click', showLoginForm);
    if (registerTab) registerTab.addEventListener('click', showRegisterForm);
    if (switchToRegister) switchToRegister.addEventListener('click', showRegisterForm);
    if (switchToLogin) switchToLogin.addEventListener('click', showLoginForm);
    
    // 登录按钮
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    
    // 注册按钮
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) registerBtn.addEventListener('click', handleRegister);
    
    // 退出登录
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    // 导航链接
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    if (navLinks) {
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = this.getAttribute('data-page');
                showPage(page);
            });
        });
    }
    
    // 兑换按钮
    const redeemBtn = document.getElementById('redeem-btn');
    if (redeemBtn) redeemBtn.addEventListener('click', handleRedeem);
    
    // 礼品搜索
    const giftSearch = document.getElementById('gift-search');
    if (giftSearch) giftSearch.addEventListener('input', filterGifts);
    
    // 礼品筛选
    const giftFilter = document.getElementById('gift-filter');
    if (giftFilter) giftFilter.addEventListener('change', filterGifts);
    
    // 礼品排序
    const giftSort = document.getElementById('gift-sort');
    if (giftSort) giftSort.addEventListener('change', filterGifts);
}

// 显示登录表单
function showLoginForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    
    if (loginForm) loginForm.classList.remove('hidden');
    if (registerForm) registerForm.classList.add('hidden');
    if (loginTab) {
        loginTab.classList.add('active', 'text-primary', 'border-primary');
        loginTab.classList.remove('text-gray-500', 'border-transparent');
    }
    if (registerTab) {
        registerTab.classList.add('text-gray-500', 'border-transparent');
        registerTab.classList.remove('active', 'text-primary', 'border-primary');
    }
}

// 显示注册表单
function showRegisterForm() {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const registerTab = document.getElementById('register-tab');
    const loginTab = document.getElementById('login-tab');
    
    if (registerForm) registerForm.classList.remove('hidden');
    if (loginForm) loginForm.classList.add('hidden');
    if (registerTab) {
        registerTab.classList.add('active', 'text-primary', 'border-primary');
        registerTab.classList.remove('text-gray-500', 'border-transparent');
    }
    if (loginTab) {
        loginTab.classList.add('text-gray-500', 'border-transparent');
        loginTab.classList.remove('active', 'text-primary', 'border-primary');
    }
}

// 处理登录
async function handleLogin() {
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    
    if (!loginUsername || !loginPassword) {
        showAuthError('登录表单元素不存在');
        return;
    }
    
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();
    
    // 验证输入
    if (!username || !password) {
        showAuthError('请输入用户名和密码');
        return;
    }
    
    try {
        // 查找用户
        const user = users.find(u => u.username === username && u.password === password);
        
        if (!user) {
            showAuthError('用户名或密码错误');
            return;
        }
        
        // 设置当前用户
        currentUser = user;
        
        // 保存登录状态
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // 显示主应用
        showMainApp();
    } catch (error) {
        console.error('Error during login:', error);
        showAuthError('登录失败，请稍后重试');
    }
}

// 处理注册
async function handleRegister() {
    const registerUsername = document.getElementById('register-username');
    const registerEmail = document.getElementById('register-email');
    const registerPassword = document.getElementById('register-password');
    const registerReferral = document.getElementById('register-referral');
    
    if (!registerUsername || !registerEmail || !registerPassword) {
        showAuthError('注册表单元素不存在');
        return;
    }
    
    const username = registerUsername.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value.trim();
    const referralId = registerReferral ? registerReferral.value.trim() : '';
    
    // 验证输入
    if (!username || !email || !password) {
        showAuthError('请填写所有必填字段');
        return;
    }
    
    // 检查用户名是否已存在
    if (users.some(u => u.username === username)) {
        showAuthError('用户名已存在');
        return;
    }
    
    try {
        // 创建新用户
        const newUser = {
            id: Date.now().toString(),
            username: username,
            password: password,
            points: 30, // 注册奖励积分
            is_admin: false
        };
        
        // 发送新用户数据到Sheet.best API
        const response = await fetch(SHEETBEST_CONFIG.API_URL + SHEETBEST_CONFIG.ENDPOINTS.USERS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newUser)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to register user: ${response.statusText}`);
        }
        
        // 处理推荐奖励
        if (referralId) {
            const referrer = users.find(u => u.id === referralId);
            
            if (referrer) {
                // 给推荐人添加积分
                referrer.points += 50;
                
                // 更新推荐人数据到Sheet.best API
                const updateResponse = await fetch(SHEETBEST_CONFIG.API_URL + SHEETBEST_CONFIG.ENDPOINTS.USERS, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: referrer.id,
                        points: referrer.points.toString()
                    })
                });
                
                if (!updateResponse.ok) {
                    console.error('Failed to update referrer points:', updateResponse.statusText);
                }
            }
        }
        
        // 重新加载用户数据
        await initData();
        
        // 自动登录新用户
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // 显示主应用
            showMainApp();
        }
    } catch (error) {
        console.error('Error during registration:', error);
        showAuthError('注册失败，请稍后重试');
    }
}

// 处理退出登录
function handleLogout() {
    // 清除当前用户
    currentUser = null;
    
    // 清除登录状态
    localStorage.removeItem('currentUser');
    
    // 显示登录界面
    showLoginScreen();
}

// 检查登录状态
function checkLoginStatus() {
    // 从本地存储获取当前用户
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            showMainApp();
        } catch (error) {
            console.error('Error parsing stored user:', error);
            localStorage.removeItem('currentUser');
            showLoginScreen();
        }
    } else {
        showLoginScreen();
    }
}

// 显示登录界面
function showLoginScreen() {
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (mainApp) mainApp.classList.add('hidden');
}

// 显示主应用
function showMainApp() {
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    
    if (loginScreen) loginScreen.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');
    
    // 更新用户信息
    updateUserInfo();
    
    // 显示默认页面
    showPage('shop');
}

// 更新用户信息
function updateUserInfo() {
    if (currentUser) {
        const userName = document.getElementById('user-name');
        const userPoints = document.getElementById('user-points');
        
        if (userName) userName.textContent = currentUser.username;
        if (userPoints) userPoints.textContent = currentUser.points;
        
        // 显示或隐藏管理入口
        const adminLink = document.querySelector('[data-page="admin"]');
        if (adminLink) {
            if (currentUser.is_admin) {
                adminLink.classList.remove('hidden');
            } else {
                adminLink.classList.add('hidden');
            }
        }
    }
}

// 显示页面
function showPage(page) {
    // 隐藏所有页面
    const pageContents = document.querySelectorAll('.page-content');
    if (pageContents) {
        pageContents.forEach(content => {
            content.classList.add('hidden');
        });
    }
    
    // 显示指定页面
    const targetPage = document.getElementById(page + '-page');
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }
    
    // 更新导航状态
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    if (navLinks) {
        navLinks.forEach(link => {
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    // 加载页面数据
    switch (page) {
        case 'shop':
            filterGifts();
            break;
        case 'history':
            loadHistory();
            break;
        case 'profile':
            loadProfile();
            break;
        case 'admin':
            loadAdminUsers();
            break;
    }
}

// 筛选礼品
function filterGifts() {
    const giftSearch = document.getElementById('gift-search');
    const giftFilter = document.getElementById('gift-filter');
    const giftSort = document.getElementById('gift-sort');
    
    if (!giftSearch || !giftFilter || !giftSort) {
        console.error('Gift search/filter/sort elements not found');
        return;
    }
    
    const searchTerm = giftSearch.value.toLowerCase().trim();
    const filter = giftFilter.value;
    const sort = giftSort.value;
    
    let filteredGifts = [...gifts];
    
    // 搜索筛选
    if (searchTerm) {
        filteredGifts = filteredGifts.filter(gift => 
            gift.name.toLowerCase().includes(searchTerm) ||
            (gift.description && gift.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // 状态筛选
    if (filter === 'available') {
        filteredGifts = filteredGifts.filter(gift => gift.status === 'available');
    } else if (filter === 'unavailable') {
        filteredGifts = filteredGifts.filter(gift => gift.status === 'unavailable');
    }
    
    // 排序
    switch (sort) {
        case 'points-asc':
            filteredGifts.sort((a, b) => a.points - b.points);
            break;
        case 'points-desc':
            filteredGifts.sort((a, b) => b.points - a.points);
            break;
        case 'name-asc':
            filteredGifts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            filteredGifts.sort((a, b) => b.name.localeCompare(a.name));
            break;
    }
    
    // 渲染礼品
    renderGifts(filteredGifts);
}

// 渲染礼品
function renderGifts(giftsToRender) {
    const container = document.getElementById('gifts-container');
    if (!container) {
        console.error('Gifts container not found');
        return;
    }
    
    container.innerHTML = '';
    
    if (giftsToRender.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-gray-400 text-5xl mb-4">
                    <i class="fa fa-gift"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-700 mb-2">暂无礼品</h3>
                <p class="text-gray-500">当前没有符合条件的礼品</p>
            </div>
        `;
        return;
    }
    
    giftsToRender.forEach(gift => {
        const giftCard = document.createElement('div');
        giftCard.className = 'bg-white rounded-lg shadow overflow-hidden';
        
        // 确保礼品图片有默认值
        const giftImage = gift.image || DEFAULT_PLACEHOLDER;
        
        giftCard.innerHTML = `
            <div class="relative">
                <img src="${giftImage}" alt="${gift.name}" class="w-full h-40 object-contain bg-gray-50 p-4" onerror="this.src='${DEFAULT_PLACEHOLDER}';">
                <div class="absolute top-2 right-2">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${gift.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${gift.status === 'available' ? '可兑换' : '已售罄'}
                    </span>
                </div>
            </div>
            <div class="p-4">
                <h3 class="text-lg font-semibold text-neutral mb-1">${gift.name}</h3>
                ${gift.description ? `<p class="text-gray-600 text-sm mb-3 line-clamp-2">${gift.description}</p>` : ''}
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center">
                        <span class="text-primary font-bold">${gift.points}</span>
                        <span class="text-gray-500 text-sm ml-1">积分</span>
                    </div>
                    <div class="text-gray-600 text-sm">
                        库存: <span class="font-medium">${gift.stock}</span>
                    </div>
                </div>
                <button class="w-full btn-primary view-gift-btn" data-id="${gift.id}">
                    查看详情
                </button>
            </div>
        `;
        container.appendChild(giftCard);
    });
    
    // 绑定查看详情事件
    const viewGiftBtns = document.querySelectorAll('.view-gift-btn');
    if (viewGiftBtns) {
        viewGiftBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const giftId = this.getAttribute('data-id');
                showGiftDetail(giftId);
            });
        });
    }
}

// 显示礼品详情
function showGiftDetail(giftId) {
    const gift = gifts.find(g => g.id === giftId);
    
    if (!gift) return;
    
    const giftDetailName = document.getElementById('gift-detail-name');
    const giftDetailDescription = document.getElementById('gift-detail-description');
    const giftDetailPoints = document.getElementById('gift-detail-points');
    const giftDetailStock = document.getElementById('gift-detail-stock');
    const giftDetailImage = document.getElementById('gift-detail-image');
    const redeemBtn = document.getElementById('redeem-btn');
    const giftDetailPage = document.getElementById('gift-detail-page');
    const shopPage = document.getElementById('shop-page');
    
    if (giftDetailName) giftDetailName.textContent = gift.name;
    if (giftDetailDescription) giftDetailDescription.textContent = gift.description || '暂无描述';
    if (giftDetailPoints) giftDetailPoints.textContent = gift.points;
    if (giftDetailStock) giftDetailStock.textContent = gift.stock;
    if (giftDetailImage) giftDetailImage.src = gift.image || DEFAULT_PLACEHOLDER;
    
    if (redeemBtn) {
        redeemBtn.setAttribute('data-gift-id', gift.id);
        
        if (gift.status !== 'available' || currentUser.points < gift.points) {
            redeemBtn.disabled = true;
            redeemBtn.classList.add('opacity-50', 'cursor-not-allowed');
            redeemBtn.textContent = gift.status !== 'available' ? '已售罄' : '积分不足';
        } else {
            redeemBtn.disabled = false;
            redeemBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            redeemBtn.textContent = '立即兑换';
        }
    }
    
    if (giftDetailPage) giftDetailPage.classList.remove('hidden');
    if (shopPage) shopPage.classList.add('hidden');
}

// 处理礼品兑换
async function handleRedeem() {
    const redeemBtn = document.getElementById('redeem-btn');
    if (!redeemBtn) {
        showToast('error', '兑换失败', '兑换按钮不存在');
        return;
    }
    
    const giftId = redeemBtn.getAttribute('data-gift-id');
    const gift = gifts.find(g => g.id === giftId);
    
    if (!gift || gift.status !== 'available' || currentUser.points < gift.points) {
        showToast('error', '兑换失败', '礼品不可兑换或积分不足');
        return;
    }
    
    try {
        // 扣除用户积分
        currentUser.points -= gift.points;
        
        // 更新用户数据到Sheet.best API
        const userResponse = await fetch(SHEETBEST_CONFIG.API_URL + SHEETBEST_CONFIG.ENDPOINTS.USERS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: currentUser.id,
                points: currentUser.points.toString()
            })
        });
        
        if (!userResponse.ok) {
            throw new Error(`Failed to update user points: ${userResponse.statusText}`);
        }
        
        // 减少礼品库存
        gift.stock -= 1;
        if (gift.stock <= 0) {
            gift.status = 'unavailable';
        }
        
        // 更新礼品数据到Sheet.best API
        const giftResponse = await fetch(SHEETBEST_CONFIG.API_URL + SHEETBEST_CONFIG.ENDPOINTS.GIFTS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: gift.id,
                stock: gift.stock.toString()
            })
        });
        
        if (!giftResponse.ok) {
            throw new Error(`Failed to update gift stock: ${giftResponse.statusText}`);
        }
        
        // 创建兑换记录
        const redemption = {
            id: Date.now().toString(),
            user_id: currentUser.id,
            gift_name: gift.name,
            points_spent: gift.points.toString(),
            date: new Date().toISOString()
        };
        
        // 添加兑换记录到Sheet.best API
        const historyResponse = await fetch(SHEETBEST_CONFIG.API_URL + SHEETBEST_CONFIG.ENDPOINTS.HISTORIES, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(redemption)
        });
        
        if (!historyResponse.ok) {
            throw new Error(`Failed to create redemption record: ${historyResponse.statusText}`);
        }
        
        // 重新加载数据
        await initData();
        
        // 更新当前用户
        const updatedUser = users.find(u => u.id === currentUser.id);
        if (updatedUser) {
            currentUser = updatedUser;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUserInfo();
        }
        
        // 显示成功提示
        showToast('success', '兑换成功', `您已成功兑换礼品: ${gift.name}`);
        
        // 返回礼品商城
        showPage('shop');
    } catch (error) {
        console.error('Error redeeming gift:', error);
        showToast('error', '兑换失败', '请稍后重试');
    }
}

// 加载兑换记录
function loadHistory() {
    const container = document.getElementById('history-list');
    const noHistory = document.getElementById('no-history');
    
    if (!container) {
        console.error('History list container not found');
        return;
    }
    
    container.innerHTML = '';
    
    // 获取用户的兑换记录
    const userRedemptions = redemptions
        .filter(r => r.userId === currentUser.id)
        .sort((a, b) => new Date(b.createDate) - new Date(a.createDate));
    
    // 显示无记录提示或记录列表
    if (userRedemptions.length === 0) {
        if (noHistory) noHistory.classList.remove('hidden');
        if (container.parentElement && container.parentElement.parentElement && container.parentElement.parentElement.parentElement) {
            container.parentElement.parentElement.parentElement.classList.add('hidden');
        }
    } else {
        if (noHistory) noHistory.classList.add('hidden');
        if (container.parentElement && container.parentElement.parentElement && container.parentElement.parentElement.parentElement) {
            container.parentElement.parentElement.parentElement.classList.remove('hidden');
        }
        
        userRedemptions.forEach(redemption => {
            const row = document.createElement('tr');
            
            // 状态标签
            let statusBadge = '<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">已完成</span>';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(redemption.createDate)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${redemption.giftName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">${redemption.points}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${statusBadge}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${redemption.createDate ? formatDate(redemption.createDate) : '-'}
                </td>
            `;
            
            container.appendChild(row);
        });
    }
}

// 加载个人资料
function loadProfile() {
    if (!currentUser) return;
    
    const profileUsername = document.getElementById('profile-username');
    const profileEmail = document.getElementById('profile-email');
    const userId = document.getElementById('user-id');
    const joinDate = document.getElementById('join-date');
    const currentPoints = document.getElementById('current-points');
    const referrer = document.getElementById('referrer');
    
    if (profileUsername) profileUsername.value = currentUser.username;
    if (profileEmail) profileEmail.value = currentUser.email || '';
    if (userId) userId.textContent = currentUser.id;
    if (joinDate) joinDate.textContent = formatDate(currentUser.joinDate || new Date().toISOString());
    if (currentPoints) currentPoints.textContent = currentUser.points;
    if (referrer) referrer.textContent = currentUser.referrerId ? '有' : '无';
    
    // 加载积分记录
    const pointsHistoryContainer = document.getElementById('points-history');
    const noPointsHistory = document.getElementById('no-points-history');
    
    if (pointsHistoryContainer) {
        pointsHistoryContainer.innerHTML = '';
        
        const userPointsHistory = pointsHistory
            .filter(ph => ph.userId === currentUser.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
        
        if (userPointsHistory.length === 0) {
            if (noPointsHistory) noPointsHistory.classList.remove('hidden');
        } else {
            if (noPointsHistory) noPointsHistory.classList.add('hidden');
            
            userPointsHistory.forEach(record => {
                const recordElement = document.createElement('div');
                recordElement.className = 'flex justify-between items-center pb-2 border-b border-gray-100';
                recordElement.innerHTML = `
                    <div>
                        <p class="text-gray-700">${record.description}</p>
                        <p class="text-xs text-gray-500">${formatDate(record.date)}</p>
                    </div>
                    <span class="font-medium ${record.type === 'earn' ? 'text-green-600' : 'text-red-600'}">
                        ${record.type === 'earn' ? '+' : '-' }${record.amount}
                    </span>
                `;
                pointsHistoryContainer.appendChild(recordElement);
            });
        }
    }
}

// 加载管理员用户列表
function loadAdminUsers() {
    const container = document.getElementById('users-list');
    if (!container) {
        console.error('Users list container not found');
        return;
    }
    
    container.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                        <i class="fa fa-user"></i>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${user.username}</div>
                        <div class="text-sm text-gray-500">${user.id}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.email || '无'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span class="px-2 py-1 text-xs font-medium rounded-full ${user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
                    ${user.is_admin ? '管理员' : '用户'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.points}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(user.joinDate || new Date().toISOString())}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <button class="text-primary hover:text-blue-700 mr-3 edit-user-btn" data-id="${user.id}">编辑</button>
                ${!user.is_admin ? '<button class="text-red-600 hover:text-red-800 delete-user-btn" data-id="' + user.id + '">删除</button>' : ''}
            </td>
        `;
        container.appendChild(row);
    });
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 显示登录错误
function showAuthError(message) {
    const errorElement = document.getElementById('auth-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        
        // 3秒后隐藏错误信息
        setTimeout(() => {
            errorElement.classList.add('hidden');
        }, 3000);
    }
}

// 显示提示信息
function showToast(type, title, message) {
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-yellow-500'} text-white`;
    toast.innerHTML = `
        <div class="flex items-center">
            <div class="mr-3">
                <i class="fa ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            </div>
            <div>
                <h4 class="font-semibold">${title}</h4>
                <p class="text-sm">${message}</p>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(toast);
    
    // 3秒后移除
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

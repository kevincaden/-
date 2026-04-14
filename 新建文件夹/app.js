/**
 * 积分兑换礼品系统
 * 基于Supabase实现的云端积分管理系统
 * 支持用户注册、登录、积分管理、礼品兑换等功能
 */

// Supabase配置
const SUPABASE_URL = 'https://dlocwxdduldllfyvjesy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsb2N3eGRkdWxkbGxmeXZqZXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5OTg5MzksImV4cCI6MjA5MTU3NDkzOX0.goKLUeA6vtm6tRJQpM2KmAnxBb9vbor8Q6a1AMMZSoE';

// 初始化Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * 全局变量
 */
let currentUser = null;

// DOM元素
const authPage = document.getElementById('auth-page');
const mainApp = document.getElementById('main-app');
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const switchToRegister = document.getElementById('switch-to-register');
const switchToLogin = document.getElementById('switch-to-login');
const authError = document.getElementById('auth-error');
const errorMessage = document.getElementById('error-message');
const logoutBtn = document.getElementById('logout-btn');
const userPoints = document.getElementById('user-points');
const userName = document.getElementById('user-name');
const welcomeName = document.getElementById('welcome-name');
const welcomePoints = document.getElementById('welcome-points');
const totalPoints = document.getElementById('total-points');
const userMenu = document.getElementById('user-menu');
const userDropdown = document.getElementById('user-dropdown');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const navLinks = document.querySelectorAll('.nav-link');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
const adminOnlyElements = document.querySelectorAll('.admin-only');

// 页面元素
const dashboardPage = document.getElementById('dashboard-page');
const shopPage = document.getElementById('shop-page');
const historyPage = document.getElementById('history-page');
const invitePage = document.getElementById('invite-page');
const adminPage = document.getElementById('admin-page');
const profilePage = document.getElementById('profile-page');

// 礼品相关元素
const popularGifts = document.getElementById('popular-gifts');
const 初级礼品容器 = document.getElementById('初级礼品-container');
const giftSearch = document.getElementById('gift-search');
const giftFilter = document.getElementById('gift-filter');
const giftSort = document.getElementById('gift-sort');

// 初始化
async function init() {
    // 检查登录状态
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // 已登录，显示主应用
        showMainApp(session.user);
    } else {
        // 未登录，显示登录页面
        showAuthPage();
    }

    // 绑定事件
    bindEvents();

    // 加载礼品数据
    loadGifts();
}

// 显示登录/注册页面
function showAuthPage() {
    authPage.classList.remove('hidden');
    mainApp.classList.add('hidden');
}

/**
 * 显示主应用页面
 * @param {Object} user - 当前登录用户
 */
async function showMainApp(user) {
    authPage.classList.add('hidden');
    mainApp.classList.remove('hidden');

    // 获取用户信息
    const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('获取用户信息失败:', error);
        return;
    }

    // 存储当前用户信息
    currentUser = userData;

    // 更新用户信息显示
    userName.textContent = userData.username;
    welcomeName.textContent = userData.username;
    userPoints.textContent = userData.points || 0;
    welcomePoints.textContent = userData.points || 0;
    totalPoints.textContent = userData.points || 0;

    // 检查是否为管理员
    if (userData.is_admin) {
        adminOnlyElements.forEach(element => {
            element.classList.remove('hidden');
        });
    } else {
        adminOnlyElements.forEach(element => {
            element.classList.add('hidden');
        });
    }

    // 加载兑换记录
    loadHistory(user.id);
}

// 绑定事件
function bindEvents() {
    // 标签页切换
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('text-primary', 'border-b-2', 'border-primary');
        loginTab.classList.remove('text-gray-500');
        registerTab.classList.remove('text-primary', 'border-b-2', 'border-primary');
        registerTab.classList.add('text-gray-500');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('text-primary', 'border-b-2', 'border-primary');
        registerTab.classList.remove('text-gray-500');
        loginTab.classList.remove('text-primary', 'border-b-2', 'border-primary');
        loginTab.classList.add('text-gray-500');
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });

    // 切换到注册
    switchToRegister.addEventListener('click', () => {
        registerTab.click();
    });

    // 切换到登录
    switchToLogin.addEventListener('click', () => {
        loginTab.click();
    });

    // 登录
    loginBtn.addEventListener('click', async () => {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        if (!username || !password) {
            showError('请填写用户名和密码');
            return;
        }

        // 查找用户
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !users) {
            showError('用户名或密码错误');
            return;
        }

        // 验证密码
        if (users.password !== password) {
            showError('用户名或密码错误');
            return;
        }

        // 登录成功
        const { data: session, error: sessionError } = await supabase.auth.signInWithPassword({
            email: `${username}@example.com`, // 使用用户名作为邮箱
            password: password
        });

        if (sessionError) {
            // 如果没有对应的用户，创建一个
            const { data: newUser, error: createError } = await supabase.auth.signUp({
                email: `${username}@example.com`,
                password: password
            });

            if (createError) {
                showError('登录失败，请重试');
                return;
            }

            // 更新用户ID
            await supabase
                .from('users')
                .update({ id: newUser.user.id })
                .eq('username', username);

            showMainApp(newUser.user);
        } else {
            showMainApp(session.user);
        }
    });

    // 注册
    registerBtn.addEventListener('click', async () => {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        if (!username || !email || !password) {
            showError('请填写所有必填字段');
            return;
        }

        // 检查用户名是否已存在
        const { data: existingUser, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (existingUser) {
            showError('用户名已存在');
            return;
        }

        // 创建用户
        const { data: user, error: createError } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (createError) {
            showError('注册失败，请重试');
            return;
        }

        // 存储用户信息到users表
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                id: user.user.id,
                username: username,
                password: password,
                points: 0,
                is_admin: false
            });

        if (insertError) {
            showError('注册失败，请重试');
            return;
        }

        // 注册成功，跳转到主页面
        showMainApp(user.user);
    });

    // 退出登录
    logoutBtn.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('退出登录失败:', error);
        } else {
            showAuthPage();
        }
    });

    // 用户下拉菜单
    userDropdown.addEventListener('click', () => {
        userMenu.classList.toggle('hidden');
    });

    // 移动端菜单
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // 导航链接
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            showPage(page);
        });
    });

    // 移动端导航链接
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            showPage(page);
            mobileMenu.classList.add('hidden');
        });
    });

    // 礼品搜索和筛选
    giftSearch.addEventListener('input', loadGifts);
    giftFilter.addEventListener('change', loadGifts);
    giftSort.addEventListener('change', loadGifts);
}

// 显示错误信息
function showError(message) {
    errorMessage.textContent = message;
    authError.classList.remove('hidden');
    setTimeout(() => {
        authError.classList.add('hidden');
    }, 3000);
}

// 显示页面
function showPage(page) {
    // 隐藏所有页面
    const pages = [dashboardPage, shopPage, historyPage, invitePage, adminPage, profilePage];
    pages.forEach(p => {
        if (p) p.classList.add('hidden');
    });

    // 显示选中页面
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }

    // 如果是管理页面，加载管理数据
    if (page === 'admin') {
        loadAdminData();
    }

    // 更新导航链接状态
    navLinks.forEach(link => {
        if (link.dataset.page === page) {
            link.classList.add('active', 'text-primary', 'font-medium');
        } else {
            link.classList.remove('active', 'text-primary', 'font-medium');
        }
    });

    // 更新移动端导航链接状态
    mobileNavLinks.forEach(link => {
        if (link.dataset.page === page) {
            link.classList.add('text-primary', 'font-medium', 'bg-blue-50');
        } else {
            link.classList.remove('text-primary', 'font-medium', 'bg-blue-50');
        }
    });
}

// 加载管理数据
async function loadAdminData() {
    // 加载所有用户
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*');

    if (usersError) {
        console.error('加载用户列表失败:', usersError);
        return;
    }

    // 渲染用户列表
    const usersList = document.getElementById('users-list');
    if (usersList) {
        usersList.innerHTML = '';
        users.forEach(user => {
            usersList.innerHTML += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-10 w-10">
                                <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                                    <i class="fa fa-user"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <div class="text-sm font-medium text-gray-900">${user.username}</div>
                                <div class="text-sm text-gray-500">${user.id}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${user.points || 0}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${user.is_admin ? '是' : '否'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button class="text-primary hover:text-blue-700 mr-3 edit-points-btn" data-user-id="${user.id}" data-current-points="${user.points || 0}">修改积分</button>
                    </td>
                </tr>
            `;
        });

        // 绑定修改积分按钮事件
        document.querySelectorAll('.edit-points-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.dataset.userId;
                const currentPoints = parseInt(btn.dataset.currentPoints);
                const newPoints = prompt('请输入新的积分值:', currentPoints);
                if (newPoints !== null) {
                    updateUserPoints(userId, parseInt(newPoints));
                }
            });
        });
    }

    // 加载所有礼品
    const { data: gifts, error: giftsError } = await supabase
        .from('gifts')
        .select('*');

    if (giftsError) {
        console.error('加载礼品列表失败:', giftsError);
        return;
    }

    // 渲染礼品列表
    const giftsList = document.getElementById('gifts-list');
    if (giftsList) {
        giftsList.innerHTML = '';
        gifts.forEach(gift => {
            giftsList.innerHTML += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-10 w-10">
                                <img class="h-10 w-10 rounded-full object-cover" src="${gift.image}" alt="${gift.name}">
                            </div>
                            <div class="ml-4">
                                <div class="text-sm font-medium text-gray-900">${gift.name}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${gift.points}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${gift.stock}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button class="text-primary hover:text-blue-700 mr-3 edit-gift-btn" data-gift-id="${gift.id}">编辑</button>
                        <button class="text-red-600 hover:text-red-900 delete-gift-btn" data-gift-id="${gift.id}">删除</button>
                    </td>
                </tr>
            `;
        });

        // 绑定编辑和删除按钮事件
        document.querySelectorAll('.edit-gift-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const giftId = btn.dataset.giftId;
                editGift(giftId);
            });
        });

        document.querySelectorAll('.delete-gift-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const giftId = btn.dataset.giftId;
                if (confirm('确定要删除这个礼品吗？')) {
                    deleteGift(giftId);
                }
            });
        });
    }
}

// 更新用户积分
async function updateUserPoints(userId, newPoints) {
    const { error } = await supabase
        .from('users')
        .update({ points: newPoints })
        .eq('id', userId);

    if (error) {
        console.error('更新用户积分失败:', error);
        alert('更新失败，请重试');
    } else {
        alert('更新成功！');
        // 重新加载管理数据
        loadAdminData();
    }
}

// 编辑礼品
async function editGift(giftId) {
    const { data: gift, error } = await supabase
        .from('gifts')
        .select('*')
        .eq('id', giftId)
        .single();

    if (error) {
        console.error('获取礼品信息失败:', error);
        return;
    }

    const name = prompt('礼品名称:', gift.name);
    const points = prompt('所需积分:', gift.points);
    const stock = prompt('库存数量:', gift.stock);
    const image = prompt('图片URL:', gift.image);

    if (name && points && stock && image) {
        const { error: updateError } = await supabase
            .from('gifts')
            .update({
                name: name,
                points: parseInt(points),
                stock: parseInt(stock),
                image: image
            })
            .eq('id', giftId);

        if (updateError) {
            console.error('更新礼品失败:', updateError);
            alert('更新失败，请重试');
        } else {
            alert('更新成功！');
            // 重新加载管理数据
            loadAdminData();
        }
    }
}

// 删除礼品
async function deleteGift(giftId) {
    const { error } = await supabase
        .from('gifts')
        .delete()
        .eq('id', giftId);

    if (error) {
        console.error('删除礼品失败:', error);
        alert('删除失败，请重试');
    } else {
        alert('删除成功！');
        // 重新加载管理数据
        loadAdminData();
    }
}

// 新增礼品
async function addGift() {
    const name = prompt('礼品名称:');
    const points = prompt('所需积分:');
    const stock = prompt('库存数量:');
    const image = prompt('图片URL:');

    if (name && points && stock && image) {
        const { error } = await supabase
            .from('gifts')
            .insert({
                name: name,
                points: parseInt(points),
                stock: parseInt(stock),
                image: image
            });

        if (error) {
            console.error('新增礼品失败:', error);
            alert('新增失败，请重试');
        } else {
            alert('新增成功！');
            // 重新加载管理数据
            loadAdminData();
        }
    }
}

// 加载礼品数据
async function loadGifts() {
    const search = giftSearch ? giftSearch.value : '';
    const filter = giftFilter ? giftFilter.value : 'all';
    const sort = giftSort ? giftSort.value : 'default';

    let query = supabase.from('gifts').select('*');

    // 搜索
    if (search) {
        query = query.ilike('name', `%${search}%`);
    }

    // 筛选
    if (filter === 'available') {
        query = query.gt('stock', 0);
    } else if (filter === 'unavailable') {
        query = query.lte('stock', 0);
    }

    // 排序
    if (sort === 'points-asc') {
        query = query.order('points', { ascending: true });
    } else if (sort === 'points-desc') {
        query = query.order('points', { ascending: false });
    } else if (sort === 'newest') {
        query = query.order('id', { ascending: false });
    }

    const { data: gifts, error } = await query;

    if (error) {
        console.error('加载礼品失败:', error);
        return;
    }

    // 渲染礼品
    renderGifts(gifts);
}

// 渲染礼品
function renderGifts(gifts) {
    if (popularGifts) {
        popularGifts.innerHTML = '';
        const popularGiftsList = gifts.slice(0, 4);
        popularGiftsList.forEach(gift => {
            popularGifts.innerHTML += `
                <div class="bg-white rounded-lg shadow overflow-hidden card-hover">
                    <div class="relative">
                        <img src="${gift.image}" alt="${gift.name}" class="w-full h-48 object-contain bg-gray-50 p-4">
                    </div>
                    <div class="p-4">
                        <h3 class="text-lg font-semibold text-neutral mb-1 truncate">${gift.name}</h3>
                        <p class="text-gray-600 text-sm mb-3 line-clamp-2">${gift.description || ''}</p>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <span class="text-primary font-bold text-xl">${gift.points}</span>
                                <span class="text-gray-500 text-sm ml-1">积分</span>
                            </div>
                            <button class="btn-primary py-1 px-3 text-sm view-gift-btn" data-gift-id="${gift.id}">查看详情</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    if (初级礼品容器) {
        初级礼品容器.innerHTML = '';
        const 初级礼品 = gifts.filter(gift => gift.points >= 25 && gift.points <= 50);
        初级礼品.forEach(gift => {
            初级礼品容器.innerHTML += `
                <div class="bg-white rounded-lg shadow overflow-hidden card-hover">
                    <div class="relative">
                        <img src="${gift.image}" alt="${gift.name}" class="w-full h-48 object-contain bg-gray-50 p-4">
                    </div>
                    <div class="p-4">
                        <h3 class="text-lg font-semibold text-neutral mb-1 truncate">${gift.name}</h3>
                        <p class="text-gray-600 text-sm mb-3 line-clamp-2">${gift.description || ''}</p>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <span class="text-primary font-bold text-xl">${gift.points}</span>
                                <span class="text-gray-500 text-sm ml-1">积分</span>
                            </div>
                            <button class="btn-primary py-1 px-3 text-sm view-gift-btn" data-gift-id="${gift.id}">查看详情</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    // 绑定查看详情按钮事件
    document.querySelectorAll('.view-gift-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const giftId = btn.dataset.giftId;
            viewGiftDetail(giftId);
        });
    });
}

// 查看礼品详情
async function viewGiftDetail(giftId) {
    const { data: gift, error } = await supabase
        .from('gifts')
        .select('*')
        .eq('id', giftId)
        .single();

    if (error) {
        console.error('获取礼品详情失败:', error);
        return;
    }

    // 获取当前用户信息
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        showAuthPage();
        return;
    }

    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

    // 检查积分是否足够
    if (userData.points < gift.points) {
        alert('积分不足，无法兑换');
        return;
    }

    // 检查库存是否充足
    if (gift.stock <= 0) {
        alert('礼品库存不足，无法兑换');
        return;
    }

    // 确认兑换
    if (confirm(`确定要兑换「${gift.name}」吗？需要消耗 ${gift.points} 积分`)) {
        // 开始事务
        const { data: updatedUser, error: userError } = await supabase
            .from('users')
            .update({ points: userData.points - gift.points })
            .eq('id', session.user.id)
            .select()
            .single();

        if (userError) {
            console.error('扣减积分失败:', userError);
            alert('兑换失败，请重试');
            return;
        }

        // 减少礼品库存
        const { error: giftError } = await supabase
            .from('gifts')
            .update({ stock: gift.stock - 1 })
            .eq('id', giftId);

        if (giftError) {
            console.error('更新库存失败:', giftError);
            alert('兑换失败，请重试');
            return;
        }

        // 生成兑换记录
        const { error: historyError } = await supabase
            .from('histories')
            .insert({
                user_id: session.user.id,
                gift_id: giftId,
                gift_name: gift.name,
                points_used: gift.points,
                created_at: new Date().toISOString()
            });

        if (historyError) {
            console.error('生成兑换记录失败:', historyError);
            alert('兑换失败，请重试');
            return;
        }

        // 更新页面显示
        userPoints.textContent = updatedUser.points;
        welcomePoints.textContent = updatedUser.points;
        totalPoints.textContent = updatedUser.points;

        // 重新加载兑换记录
        loadHistory(session.user.id);

        alert('兑换成功！');
    }
}

// 加载兑换记录
async function loadHistory(userId) {
    const { data: history, error } = await supabase
        .from('histories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('加载兑换记录失败:', error);
        return;
    }

    // 渲染兑换记录
    const activityLog = document.getElementById('activity-log');
    if (activityLog) {
        if (history.length === 0) {
            activityLog.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-gray-500">暂无活动记录</td></tr>';
        } else {
            activityLog.innerHTML = '';
            history.forEach(item => {
                activityLog.innerHTML += `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(item.created_at).toLocaleString()}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">兑换礼品: ${item.gift_name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">-${item.points_used}</td>
                    </tr>
                `;
            });
        }
    }
}

// 初始化应用
init();
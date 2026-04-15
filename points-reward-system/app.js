const CONFIG = {
    BASE_URL: "https://api.sheetbest.com/sheets/87572aa7-279a-4a0d-82b6-6ed615c0f9b7",
    TABS: { USERS: "/tabs/users", GIFTS: "/tabs/gifts" }
};

let currentUser = null;

async function login() {
    const userInp = document.getElementById('login-username').value.trim();
    const passInp = document.getElementById('login-password').value.trim();
    
    console.log("正在尝试登录，输入值为:", { userInp, passInp });

    try {
        // 加上时间戳防止 API 缓存旧数据
        const res = await fetch(`${CONFIG.BASE_URL}${CONFIG.TABS.USERS}?_t=${Date.now()}`);
        const users = await res.json();
        
        console.log("从表格获取到的原始用户列表:", users);

        // 【核心修复】：无论表格里是数字还是字符，统一转成字符串去空格再对比
        const user = users.find(u => {
            const dbName = String(u.username || u['username'] || "").trim();
            const dbPass = String(u.password || u['password'] || "").trim();
            return dbName === userInp && dbPass === passInp;
        });

        if (user) {
            console.log("匹配成功！", user);
            // 处理管理员权限判断
            const adminFlag = String(user.is_admin || "").toUpperCase();
            user.is_admin = (adminFlag === "TRUE");
            
            currentUser = user;
            localStorage.setItem('reward_user', JSON.stringify(user));
            renderUI();
        } else {
            alert(`登录失败！\n请检查：\n1. 用户名/密码大小写\n2. 表格表头是否确实为 username 和 password`);
        }
    } catch (e) {
        console.error("网络请求错误:", e);
        alert("无法连接到 Google 表格，请检查网络。");
    }
}

// 其余 renderUI, loadGifts 等函数保持不变...

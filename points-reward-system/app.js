const CONFIG = {
    BASE_URL: "https://api.sheetbest.com/sheets/87572aa7-279a-4a0d-82b6-6ed615c0f9b7",
    TABS: { USERS: "/tabs/users", GIFTS: "/tabs/gifts" }
};

// 1. 强制绑定点击事件
window.onload = () => {
    console.log("页面加载完毕，正在绑定按钮...");
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            console.log("检测到点击，开始执行登录...");
            login();
        });
    } else {
        console.error("致命错误：网页里找不到 ID 为 'login-btn' 的按钮！");
    }
};

async function login() {
    const userInp = document.getElementById('login-username').value.trim();
    const passInp = document.getElementById('login-password').value.trim();
    
    if (!userInp || !passInp) {
        alert("请输入账号和密码后再试！");
        return;
    }

    // 显示加载提示
    const btn = document.getElementById('login-btn');
    const originalText = btn.innerText;
    btn.innerText = "正在通讯中...";
    btn.disabled = true;

    try {
        console.log("正在请求数据...");
        const res = await fetch(`${CONFIG.BASE_URL}${CONFIG.TABS.USERS}?_t=${Date.now()}`);
        
        if (!res.ok) throw new Error("API 连接失败");

        const users = await res.json();
        console.log("获取成功，用户总数:", users.length);
        console.log("表格内的数据预览:", users);

        const user = users.find(u => {
            // 兼容所有可能的列名写法
            const dbName = String(u.username || u['username'] || "").trim();
            const dbPass = String(u.password || u['password'] || "").trim();
            return dbName === userInp && dbPass === passInp;
        });

        if (user) {
            alert(`欢迎回来，${userInp}！`);
            localStorage.setItem('reward_user', JSON.stringify(user));
            location.reload(); // 登录成功直接刷新页面进入主程序
        } else {
            alert("登录失败：账号或密码不匹配。\n提示：请检查大小写。");
        }
    } catch (e) {
        console.error("登录逻辑报错:", e);
        alert("连接异常，请检查：\n1. 网络/VPN 是否开启\n2. API 额度是否用完");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

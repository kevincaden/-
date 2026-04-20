# 积分奖励系统

一个基于HTML、Tailwind CSS和JavaScript的积分奖励系统，使用谷歌表格作为数据存储。

## 功能特点

- **多移动端共享数据**：使用谷歌表格作为数据存储，实现多设备数据同步
- **管理员功能**：直接在前端修改用户积分、增删礼品，前端改动可同步到后端数据库
- **礼品分类**：根据积分范围分为初级（25-50积分）、中级（50-75积分）和高级（75+积分）三个部分
- **用户管理**：支持用户注册、登录、个人中心管理
- **积分管理**：支持积分发放、积分记录查询
- **礼品管理**：支持礼品添加、编辑、删除
- **兑换管理**：支持礼品兑换申请和审批

## 技术栈

- HTML5
- Tailwind CSS v3
- JavaScript
- Chart.js
- 谷歌表格 + SheetDB API

## 部署步骤

1. **准备谷歌表格**
   - 创建一个谷歌表格，包含以下工作表：
     - `users`：存储用户信息
     - `gifts`：存储礼品信息
     - `redemptions`：存储兑换记录
     - `points_history`：存储积分变动记录

2. **设置SheetDB**
   - 访问 [SheetDB](https://sheetdb.io/) 并注册账号
   - 连接你的谷歌表格，获取API密钥
   - 在 `index.html` 文件中更新 `API_BASE_URL` 为你的SheetDB API地址

3. **部署到GitHub Pages**
   - 创建一个GitHub仓库
   - 上传项目文件到仓库
   - 在仓库设置中启用GitHub Pages
   - 选择 `main` 分支作为源

4. **访问系统**
   - 打开GitHub Pages生成的URL
   - 使用默认管理员账号登录：
     - 用户名：admin
     - 密码：admin123

## 本地开发

1. 克隆仓库到本地
2. 在浏览器中打开 `index.html` 文件
3. 或者使用本地服务器：
   ```bash
   python -m http.server 3000
   ```
4. 访问 `http://localhost:3000`

## 数据结构

### 用户表 (users)
- id: 用户ID
- username: 用户名
- password: 密码
- email: 邮箱
- role: 角色（admin/user）
- points: 积分
- joinDate: 注册日期
- referrerId: 推荐人ID
- referrals: 推荐用户ID列表
- pointsHistory: 积分变动历史

### 礼品表 (gifts)
- id: 礼品ID
- name: 礼品名称
- description: 礼品描述
- points: 所需积分
- stock: 库存数量
- image: 礼品图片URL
- status: 状态（available/unavailable）
- createDate: 创建日期

### 兑换记录表 (redemptions)
- id: 兑换记录ID
- userId: 用户ID
- giftId: 礼品ID
- points: 消耗积分
- status: 状态（pending/completed）
- requestDate: 申请日期
- completeDate: 完成日期

### 积分变动表 (points_history)
- id: 记录ID
- userId: 用户ID
- type: 类型（earn/spend）
- amount: 积分数量
- description: 描述
- date: 日期

## 注意事项

- 本系统使用本地存储作为API调用失败时的备份
- 请确保谷歌表格权限设置正确，允许SheetDB访问
- 生产环境中请修改默认管理员密码
- 建议定期备份谷歌表格数据

## 许可证

MIT

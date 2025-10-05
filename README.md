2025英雄联盟全球总决赛模拟器
基于 Bradley-Terry 模型的 2025 LOL Worlds 赛果模拟器。
🎮 功能特性

完整赛制模拟：入围赛、瑞士轮、淘汰赛全流程
科学的概率模型：Bradley-Terry 模型计算对阵胜率
真实的抽签规则：瑞士轮首轮 POOL 分配与同赛区避战
赔率归一化：消除博彩商抽水，确保概率总和为 1
状态波动模拟：每局±10%状态波动，模拟比赛日起伏
详细数据展示：每场比赛显示理论胜率和实际战果

📊 模型说明
Bradley-Terry 模型

强度计算：s_i = -ln(odds_normalized)
单局胜率：P(A胜B) = 1/(1 + e^(-γ(s_A - s_B)))，其中 γ = 0.5
系列赛胜率：通过二项式分布累积计算 BO3/BO5 胜率
状态波动：每局独立施加 ±10% 波动

赔率处理流程
1. 在赔率区间内随机选择
2. 计算隐含概率 p_i = 1/odds_i
3. 归一化使 Σp_i = 1（消除抽水）
4. 计算强度 s_i = -ln(odds_normalized)
🚀 快速开始
安装依赖
bashnpm install
本地开发
bashnpm run dev
访问 http://localhost:5173
构建生产版本
bashnpm run build
部署到 GitHub Pages

修改 package.json 中的 homepage 字段为您的仓库地址
运行部署命令：

bashnpm run deploy
📁 项目结构
worlds-2025-simulator/
├── src/
│   ├── App.jsx           # 主应用组件（模拟器）
│   ├── main.jsx          # 入口文件
│   └── index.css         # 全局样式
├── index.html            # HTML 模板
├── vite.config.js        # Vite 配置
├── package.json          # 项目配置
└── README.md            # 项目文档
🎯 使用说明

点击「开始模拟比赛」按钮
查看完整赛程模拟结果
点击「重新模拟」生成新的随机赛果

每次模拟都会：

在赔率区间内随机选择赔率
归一化处理确保概率总和为 1
为每场比赛施加独立的状态波动

📝 赛制说明
入围赛（10月14日）

iG vs T1，BO5 单场决胜
胜者进入瑞士轮 POOL3

瑞士轮（10月15-25日）

16 支队伍，三胜晋级，三败淘汰
首轮特殊抽签：POOL1 vs POOL3，POOL2 内部对战
同赛区避战，采用顺延策略
决定性对局（2胜或2负）BO3，其他 BO1

淘汰赛（10月28日-11月9日）

八强、四强、决赛全部 BO5
八强赛：上海梅赛德斯-奔驰文化中心
半决赛：上海（无缝衔接）
决赛：成都东安湖体育公园

📊 数据来源
赔率数据综合自多家博彩公司（2025年9月数据），包括：

17 支参赛队伍的冠军赔率区间
覆盖 LPL、LCK、LEC、LTA、LCP 五大赛区

🛠️ 技术栈

React 18：用户界面
Vite：构建工具
Lucide React：图标库
Tailwind CSS：样式（通过内联类）

📄 许可证
MIT License
🤝 贡献
欢迎提交 Issue 和 Pull Request！
📮 联系方式
如有问题或建议，请通过 GitHub Issues 联系。

⚡ 祝您在 2025 全球总决赛中找到心仪的预测结果！

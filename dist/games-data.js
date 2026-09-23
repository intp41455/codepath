var BEGINNER_GAMES=[
 {id:'computer-quest',title:'电脑探险岛',icon:'🖱️',color:'#37b48d',desc:'认识鼠标、键盘、窗口和文件夹。完全不写代码。',unlock:'完成后开启“编程思维”',rounds:[
  {type:'choice',prompt:'想打开桌面上的“此电脑”，最稳妥的做法是？',options:['快速双击图标','一直按住电源键','把鼠标翻过来'],answer:0,why:'双击用于打开桌面图标；长按电源会强制关机。'},
  {type:'order',prompt:'把“复制一段文字”的步骤排好顺序。',items:['按 Ctrl+C','拖动选中文字','在目标处按 Ctrl+V'],answer:['拖动选中文字','按 Ctrl+C','在目标处按 Ctrl+V'],why:'先选中，复制，再到目标位置粘贴。'},
  {type:'choice',prompt:'文件不小心删掉后，第一处应该去哪里找？',options:['回收站','浏览器历史','音量设置'],answer:0,why:'一般删除的文件会先进入回收站，仍有机会恢复。'},
  {type:'typing',prompt:'请输入保存快捷键中的字母（Ctrl + ?）。',answer:'s',why:'Ctrl+S 表示保存。大小写都可以。'},
  {type:'choice',prompt:'下载的文件通常先出现在哪个文件夹？',options:['下载','图片','回收站'],answer:0,why:'浏览器默认通常保存到“下载”文件夹。'}
 ]},
 {id:'thinking-quest',title:'指令迷宫',icon:'🧩',color:'#6d66d9',desc:'用顺序、条件、重复和函数帮机器人走出迷宫。',unlock:'完成后开启“Python 慢速起步”',requires:'computer-quest',rounds:[
  {type:'order',prompt:'机器人要喝水，请排列步骤。',items:['拿起杯子','打开水龙头','接水','关闭水龙头'],answer:['拿起杯子','打开水龙头','接水','关闭水龙头'],why:'程序按顺序执行，顺序变化可能导致结果不同。'},
  {type:'choice',prompt:'规则是“如果下雨就带伞”。今天没下雨，应当？',options:['不执行带伞动作','仍然一定带伞','重复开机'],answer:0,why:'条件为假时，不执行条件内的动作。'},
  {type:'choice',prompt:'给名单里的每个人发消息，最适合哪种思路？',options:['逐项重复','只做一次','永远重复'],answer:0,why:'逐项重复会让名单中的每一项都被处理。'},
  {type:'typing',prompt:'函数“加倍”收到 6，请输入返回结果。',answer:'12',why:'加倍就是乘以 2，所以 6 变成 12。'},
  {type:'choice',prompt:'“达到 60 分算通过”，最关键的边界测试是？',options:['60','6000','随便一个数'],answer:0,why:'边界 60 能检查规则是否包含“刚好达到”。'}
 ]},
 {id:'python-quest',title:'Python 萌芽塔',icon:'🐍',color:'#e39a38',desc:'认符号、追变量、选分支，一层一层登塔。',unlock:'完成后开启“Python 基础与实战”',requires:'thinking-quest',rounds:[
  {type:'order',prompt:'按 print("你好") 中出现的顺序排列。',items:['文字','print','括号'],answer:['print','括号','文字'],why:'先是功能名 print，再是括号，括号内是带引号的文字。'},
  {type:'choice',prompt:'print(2 + 3) 会显示什么？',options:['5','23','2 + 3'],answer:0,why:'没有引号的 2 和 3 是数字，会先计算加法。'},
  {type:'choice',prompt:'执行 x = 8 后，变量 x 保存了什么？',options:['8','字母 x','等号'],answer:0,why:'等号右边的 8 被保存到左边名字 x。'},
  {type:'typing',prompt:'add_one(9) 会返回多少？',answer:'10',why:'函数将收到的 9 加 1，返回 10。'},
  {type:'choice',prompt:'score=59，条件 score >= 60 为？',options:['假','真','无法判断'],answer:0,why:'59 没有达到 60，所以条件为假。'}
 ]},
 {id:'bug-hunt',title:'Bug 捕虫队',icon:'🐞',color:'#e15c64',desc:'从现象找原因，练会“先复现，再修改”。',requires:'python-quest',rounds:[
  {type:'choice',prompt:'代码报 SyntaxError，第一步应该？',options:['看报错行附近的括号和引号','重装电脑','删除全部代码'],answer:0,why:'语法错误常来自缺失的符号，应先检查报错位置附近。'},
  {type:'choice',prompt:'测试失败后，哪种做法最容易定位问题？',options:['一次只改一个因素','同时改十处','不看输入直接猜'],answer:0,why:'一次改一个因素，才能知道哪次修改影响了结果。'},
  {type:'typing',prompt:'规则“2+3 应为 5”，实际得到 6。请输入预期值。',answer:'5',why:'测试要明确输入、预期结果和实际结果。'},
  {type:'choice',prompt:'只测试正常输入，能否证明没有 Bug？',options:['不能','能','测试名字长就能'],answer:0,why:'还需要边界、错误输入和失败路径。'}
 ]},
 {id:'safe-ai',title:'AI 安全守门员',icon:'🛡️',color:'#3079c7',desc:'判断 AI 生成代码能不能直接运行。',requires:'python-quest',rounds:[
  {type:'choice',prompt:'AI 给出删除文件命令，你第一步应该？',options:['看清绝对路径和影响范围','直接运行','发给所有人'],answer:0,why:'破坏性命令先核对目标、备份和影响范围。'},
  {type:'choice',prompt:'代码里出现真实 API Key，应该？',options:['撤销并轮换密钥，改用环境变量','提交到 GitHub','截图分享'],answer:0,why:'真实密钥泄漏后需轮换，代码只读取安全配置。'},
  {type:'choice',prompt:'AI 说“测试都通过”，最可靠的验证是？',options:['亲自运行测试并检查范围','相信语气','看代码行数'],answer:0,why:'要有可复现命令、结果和覆盖范围。'},
  {type:'typing',prompt:'输入三个字：运行陌生项目前先看哪个说明文件？',answer:'README',aliases:['readme','README.md','readme.md'],why:'README 通常说明用途、安装和运行方式。'}
 ]},
 {id:'repo-scout',title:'陌生项目侦察局',icon:'🕵️',color:'#7656a5',desc:'练习从 README 到入口、核心流程和小改动。',requires:'python-quest',rounds:[
  {type:'order',prompt:'第一次接触陌生项目，请排序。',items:['运行测试','阅读 README','找到启动入口','做一个小改动'],answer:['阅读 README','找到启动入口','运行测试','做一个小改动'],why:'先理解运行方式和入口，再建立基线，最后修改。'},
  {type:'choice',prompt:'想追踪“点击按钮后发生什么”，先找？',options:['按钮绑定的事件处理函数','随机图片','许可证年份'],answer:0,why:'事件处理函数通常是用户操作进入代码流程的第一站。'},
  {type:'choice',prompt:'改动前先运行现有测试的目的？',options:['建立原本是否通过的基线','让文件变大','改变项目名称'],answer:0,why:'基线能区分原有问题和本次改动引入的问题。'},
  {type:'typing',prompt:'完成小改动后必须再次运行什么？',answer:'测试',aliases:['tests','test'],why:'再次测试才能检查改动是否破坏既有行为。'}
 ]}
];
var TRACK_GATES={
 'thinking-zero':'computer-quest',
 'python-slow':'thinking-quest',
 'python':'python-quest'
};



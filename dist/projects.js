const FASTAPI_REFERENCE = `# main.py
from contextlib import asynccontextmanager
from pathlib import Path
import os
import sqlite3
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

DB_PATH = Path(os.getenv("TASK_DB", "tasks.db"))

def connect():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    return db

@asynccontextmanager
async def lifespan(app):
    db = connect()
    try:
        db.execute("CREATE TABLE IF NOT EXISTS tasks(id INTEGER PRIMARY KEY, title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0 CHECK(done IN (0,1)))")
        db.commit()
    finally:
        db.close()
    yield

app = FastAPI(lifespan=lifespan)

class TaskIn(BaseModel):
    title: str = Field(min_length=1, max_length=100)

    @field_validator("title", mode="before")
    @classmethod
    def clean_title(cls, value):
        if isinstance(value, str):
            return value.strip()
        return value

class TaskUpdate(BaseModel):
    done: bool

@app.post("/tasks", status_code=201)
def create_task(task: TaskIn):
    db = connect()
    try:
        cursor = db.execute("INSERT INTO tasks(title) VALUES (?)", (task.title,))
        db.commit()
        return {"id": cursor.lastrowid, "title": task.title, "done": False}
    finally:
        db.close()

@app.get("/tasks")
def list_tasks(done: bool | None = None):
    db = connect()
    try:
        if done is None:
            rows = db.execute("SELECT * FROM tasks ORDER BY id").fetchall()
        else:
            rows = db.execute("SELECT * FROM tasks WHERE done=? ORDER BY id", (int(done),)).fetchall()
        return [{"id": row["id"], "title": row["title"], "done": bool(row["done"])} for row in rows]
    finally:
        db.close()

@app.patch("/tasks/{task_id}")
def update_task(task_id: int, task: TaskUpdate):
    db = connect()
    try:
        cursor = db.execute("UPDATE tasks SET done=? WHERE id=?", (int(task.done), task_id))
        if cursor.rowcount == 0:
            raise HTTPException(404, "任务不存在")
        db.commit()
        return {"id": task_id, "done": task.done}
    finally:
        db.close()
`;
const FASTAPI_TESTS = `# test_main.py
import pytest
from fastapi.testclient import TestClient
import main

@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(main, "DB_PATH", tmp_path / "test.db")
    with TestClient(main.app) as value:
        yield value

def test_create_and_list(client):
    response = client.post("/tasks", json={"title": "  学习  "})
    assert response.status_code == 201
    task = response.json()
    assert task["title"] == "学习"
    assert client.get("/tasks").json() == [task]

def test_reject_blank(client):
    assert client.post("/tasks", json={"title": "   "}).status_code == 422

def test_filter_false(client):
    first = client.post("/tasks", json={"title": "A"}).json()
    second = client.post("/tasks", json={"title": "B"}).json()
    assert client.patch(f"/tasks/{first['id']}", json={"done": True}).status_code == 200
    assert client.get("/tasks?done=false").json() == [second]

def test_missing(client):
    assert client.patch("/tasks/999", json={"done": True}).status_code == 404

def test_length_boundary(client):
    assert client.post("/tasks", json={"title": "a" * 100}).status_code == 201
    assert client.post("/tasks", json={"title": "a" * 101}).status_code == 422
`;
const JAVA_REPOSITORY = `// src/main/java/com/example/demo/TaskRepository.java
package com.example.demo;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class TaskRepository {
    private final JdbcTemplate jdbc;
    public TaskRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public List<Map<String, Object>> findAll() {
        return jdbc.queryForList("SELECT id, title, done FROM tasks ORDER BY id");
    }
    public void add(String title) {
        jdbc.update("INSERT INTO tasks(title, done) VALUES (?, ?)", title, false);
    }
}
`;
const JAVA_SERVICE = `// TaskService.java（与启动类放在相同包）
package com.example.demo;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {
    private final TaskRepository repository;
    public TaskService(TaskRepository repository) { this.repository = repository; }
    public List<Map<String, Object>> list() { return repository.findAll(); }
    @Transactional
    public void create(String title) {
        String clean = title.strip();
        if (clean.isEmpty() || clean.length() > 100) {
            throw new IllegalArgumentException("标题长度应为 1 到 100");
        }
        repository.add(clean);
    }
}
`;
const JAVA_CONTROLLER = `// TaskController.java
package com.example.demo;
import java.util.List;
import java.util.Map;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tasks")
public class TaskController {
    private final TaskService service;
    public TaskController(TaskService service) { this.service = service; }
    public record TaskRequest(@NotBlank @Size(max=100) String title) {}
    @GetMapping
    public List<Map<String, Object>> list() { return service.list(); }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> create(@Valid @RequestBody TaskRequest task) {
        service.create(task.title());
        return Map.of("status", "created");
    }
}
`;
const AGENT_REFERENCE = `# agent.py - deterministic teaching mock, not a real LLM
DOCUMENTS = [
    {"id": "python-1", "text": "Python 使用 def 定义函数。"},
    {"id": "sql-1", "text": "SQL 使用 SELECT 查询数据。"},
]

def search(query):
    if not isinstance(query, str) or not query.strip():
        return []
    return [d for d in DOCUMENTS if query.lower() in d["text"].lower()]

def mock_model(state):
    if state["evidence"] is None:
        return {"tool": "search", "args": {"query": state["query"]}}
    return {"tool": "finish", "args": {}}

def run(query, max_steps=3):
    state = {"query": query, "evidence": None, "trace": []}
    for step in range(max_steps):
        decision = mock_model(state)
        state["trace"].append({"step": step, "tool": decision["tool"]})
        if decision["tool"] == "search":
            value = decision.get("args", {}).get("query")
            if not isinstance(value, str):
                raise ValueError("query 必须是字符串")
            state["evidence"] = search(value)
        elif decision["tool"] == "finish":
            if not state["evidence"]:
                return {"answer": "没有足够证据", "trace": state["trace"]}
            doc = state["evidence"][0]
            return {"answer": f"{doc['text']} [{doc['id']}]", "trace": state["trace"]}
        else:
            raise ValueError("不允许的工具")
    return {"answer": "达到步数上限，任务未完成", "trace": state["trace"]}

if __name__ == "__main__":
    print(run("Python"))
    print(run("不存在"))
`;
PROJECTS.push(
{id:'expense-cli',title:'个人记账小工具',level:'入门 · Python',tags:['函数','JSON','文件','测试'],desc:'把支出保存到文件，重新打开后仍能读取，并按类别汇总。',prereq:'Python 全部基础课；开发工具第 1、2 课。',deliverable:'一个可以新增支出、读取历史和统计总额的本机 Python 程序。金额用整数分保存，避免浮点金额误差。',stages:[
{title:'先定义数据与规则',steps:['新建 expense-lab 文件夹和 ledger.py。每笔记录包含 category 和 cents。','约定 cents 必须是正整数，category 去掉空白后不能为空。','先写 add_expense 和 totals 两个函数，不做界面。'],code:`def add_expense(items, category, cents):
    category = category.strip()
    if not category or type(cents) is not int or cents <= 0:
        raise ValueError("类别不能为空，金额必须是正整数分")
    return items + [{"category": category, "cents": cents}]

def totals(items):
    result = {}
    for item in items:
        key = item["category"]
        result[key] = result.get(key, 0) + item["cents"]
    return result
`},
{title:'保存与加载，再连接主流程',steps:['把下列代码追加到 ledger.py。Path(__file__) 让数据文件固定在脚本旁边。','文件不存在时使用空列表；JSON 损坏则让错误明确暴露，先不要自动覆盖。','运行 py ledger.py 两次，观察第二次是否保留并新增记录。'],code:`from pathlib import Path
import json
DATA = Path(__file__).with_name("expenses.json")

def load():
    if not DATA.exists():
        return []
    return json.loads(DATA.read_text(encoding="utf-8"))

def save(items):
    DATA.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")

if __name__ == "__main__":
    items = add_expense(load(), "学习", 2500)
    save(items)
    for category, cents in totals(items).items():
        print(f"{category}: {cents / 100:.2f} 元")
`},
{title:'补上测试与交互',steps:['新建 test_ledger.py，先测试纯函数，不向真实账本写入数据。','在主流程中用 input 收集类别和金额分，捕获转换与校验错误，失败时不保存。','不要把不可信 JSON 直接当成合法账本；独立挑战时补文件结构校验。'],code:`from ledger import add_expense, totals

def test_totals():
    items = add_expense([], "餐饮", 2000)
    items = add_expense(items, "餐饮", 1500)
    assert totals(items) == {"餐饮": 3500}

def test_no_mutation():
    original = []
    result = add_expense(original, "交通", 500)
    assert original == [] and len(result) == 1
`}],checks:['新增两笔同类支出后汇总正确','程序重启仍可读回记录','负金额和空类别被拒绝','测试不污染真实练习账本','能解释每个函数的输入、输出和文件副作用'],challenge:'增加按月份统计；先决定日期格式，再增加数据迁移规则与测试。最后不看参考实现，重新写出新增支出的函数。'},
{id:'dependency-map',title:'模块依赖分析器',level:'基础 · 数据结构',tags:['图','BFS','循环依赖','测试'],desc:'输入模块之间的依赖，找出一个入口能够影响哪些模块。',prereq:'数据结构与算法全部小节。',deliverable:'一个读取邻接表并输出可达模块的脚本，以及一张与输出一致的依赖图。',stages:[{title:'用数据表达项目结构',steps:['新建 dependencies.py。用字典表示 api → service → repository → database。','增加 service → model_client 这条依赖。','说明这里是手工输入关系，还不是自动源码分析器。'],code:`GRAPH = {
    "api": ["service"],
    "service": ["repository", "model_client"],
    "repository": ["database"],
    "model_client": [],
    "database": []
}`},{title:'遍历、排序与验证',steps:['实现可达模块遍历，避免循环导致无限执行。','输出时排序，保证可重复比较。','临时加入 database → service，确认程序仍结束。'],code:`from collections import deque

def reachable(graph, start):
    seen, queue = {start}, deque([start])
    while queue:
        node = queue.popleft()
        for child in graph.get(node, []):
            if child not in seen:
                seen.add(child)
                queue.append(child)
    return sorted(seen)

assert reachable({"a": ["b"], "b": ["a"]}, "a") == ["a", "b"]
assert reachable({}, "x") == ["x"]
print(reachable(GRAPH, "api"))`},{title:'把结果画出来并解释限制',steps:['在纸上或 Markdown 中画节点和箭头，与 GRAPH 一一对应。','指出“可达依赖”与“本次请求实际执行”不是同一件事。','写明 O(V+E) 遍历复杂度；最终排序另外需要 O(V log V)。']}],checks:['环不会导致无限循环','孤立节点处理正确','图与输入关系一致','能解释依赖图和动态调用链的区别'],challenge:'增加“改动一个模块，会影响哪些调用方”的反向遍历；为菱形依赖与循环依赖补测试。'},
{id:'sql-report',title:'支出与预算分析报表',level:'基础 · SQL',tags:['建表','JOIN','聚合','数据校验'],desc:'自己建库、录入数据、生成预算对照表，解释每个统计口径。',prereq:'SQL 七个小节与本机 Python。',deliverable:'一个可重复执行的 report.py，输出类别、支出、预算与剩余额度。',stages:[{title:'准备可重复的数据环境',steps:['新建 report.py，使用 Python 自带 sqlite3。','先用内存数据库练习，确保重复运行不会累积旧数据。','以整数分保存金额，在展示时才除以 100。'],code:`import sqlite3
db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE budgets(category TEXT PRIMARY KEY, cents INTEGER NOT NULL);
CREATE TABLE expenses(id INTEGER PRIMARY KEY, category TEXT NOT NULL, cents INTEGER NOT NULL);
INSERT INTO budgets VALUES('餐饮',10000),('交通',3000),('学习',20000);
INSERT INTO expenses VALUES(1,'餐饮',2000),(2,'餐饮',3500),(3,'交通',500);
""")`},{title:'保留没有支出的类别',steps:['从预算表开始 LEFT JOIN 支出表，让“学习”也出现在结果中。','用 COALESCE 将没有支出的 NULL 替换为 0。','按类别分组，输出稳定排序。'],code:`query = """
SELECT b.category, COALESCE(SUM(e.cents),0) AS spent,
       b.cents AS budget, b.cents-COALESCE(SUM(e.cents),0) AS remaining
FROM budgets b
LEFT JOIN expenses e ON e.category=b.category
GROUP BY b.category, b.cents
ORDER BY b.category
"""
rows = db.execute(query).fetchall()
for category, spent, budget, remaining in rows:
    print(category, spent / 100, budget / 100, remaining / 100)
assert next(row for row in rows if row[0] == "学习")[1] == 0
db.close()`},{title:'核对口径与边界',steps:['手算餐饮 55 元、剩余 45 元，与结果比较。','增加一笔超预算支出，确认剩余为负数。','考虑有支出但没有预算的类别：本查询不会显示，记录此限制并改进。']}],checks:['无支出类别仍出现','餐饮支出与手算一致','超预算表现明确','能够解释 LEFT JOIN 与 NULL','统计口径与未覆盖情况已记录'],challenge:'增加独立“无预算支出”报表，并验证没有漏记任何支出金额。'},
{id:'fastapi-tasks',title:'可持久化的任务管理 API',level:'进阶 · FastAPI',tags:['FastAPI','SQLite','校验','接口测试'],desc:'从创建、筛选到完成任务，建立一条能测试、能追踪的后端业务链路。',prereq:'Python、SQL、开发工具与 FastAPI 六课。',deliverable:'任务 API、SQLite 数据库、五项接口测试和运行说明。该练习只在本机运行，不包含登录与生产部署。',stages:[{title:'建立独立工程',steps:['新建 task-api 文件夹；运行 py -m venv .venv。','用 .\\.venv\\Scripts\\python.exe -m pip install "fastapi[standard]" pytest httpx 安装依赖。','创建 main.py 与 test_main.py；先写需求：创建、列表、完成、按完成状态筛选。']},{title:'先自己实现，再对照参考',steps:['先完成最小 GET /tasks 与 POST /tasks，再加入 SQLite。','写入 SQL 使用参数绑定，连接在 finally 中关闭。','注意 done=None 与 done=False 的差别；以下参考实现是需要你读懂的完整练习起点。'],code:FASTAPI_REFERENCE},{title:'运行与自动测试',steps:['将下列测试保存为 test_main.py。','运行 .\\.venv\\Scripts\\python.exe -m pytest，观察成功与失败用例。','运行 .\\.venv\\Scripts\\python.exe -m uvicorn main:app --reload，然后在 /docs 操作。'],code:FASTAPI_TESTS},{title:'追踪一次请求与做改动',steps:['画 POST /tasks → TaskIn 校验 → create_task → SQLite → JSON 的链路。','为每个关键函数填写输入、输出、异常与副作用。','自行增加标题关键词筛选，明确与 done 筛选同时使用的规则，再补测试。']}],checks:['合法创建返回 201 并能查询','全空格标题返回 422','done=false 不会被误当成未传值','不存在的任务更新返回 404','重启仍保留 tasks.db 中的记录','测试使用临时数据库','可以逐句解释 create_task 和 list_tasks'],challenge:'将单文件拆为路由、服务、仓储三层，保持原测试通过；再添加一个新需求，说明每个文件为何改变。'},
{id:'java-tasks',title:'分层的 Java 任务服务',level:'进阶 · Spring Boot',tags:['Java','Spring Boot','JDBC','H2'],desc:'通过构造函数注入和明确分层，建立可解释的 Java 后端。',prereq:'Java、Spring Boot、SQL 全部基础课。',deliverable:'Controller → Service → Repository → H2 的创建与列表服务，以及请求验证记录。',stages:[{title:'用兼容配置生成项目',steps:['打开 https://start.spring.io，选择 Maven、Java、稳定版 Spring Boot、兼容的 JDK。','Group 填 com.example，Artifact 填 demo；添加 Spring Web、JDBC API、H2 Database、Validation。','解压后保留生成的 pom.xml 和启动类，不从不同版本教程复制整个依赖清单。']},{title:'建立数据库和配置',steps:['在 src/main/resources/schema.sql 写下建表语句。','在 application.properties 添加数据源配置。','此配置使用文件 H2；数据库保存在项目 data 目录，保留数据文件可跨重启保存。'],code:`# application.properties
spring.datasource.url=jdbc:h2:file:./data/tasks
spring.datasource.username=sa
spring.datasource.password=
spring.sql.init.mode=always

-- schema.sql（另一个文件，不要与 properties 混写）
CREATE TABLE IF NOT EXISTS tasks (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE
);`},{title:'实现仓储与服务',steps:['将 TaskRepository.java 保存到 com/example/demo 下。','将下一阶段的 TaskService.java 保存到相同包。','逐行解释构造函数、参数绑定和事务注解。'],code:JAVA_REPOSITORY},{title:'编写业务服务',steps:['Service 负责清理标题并检查业务规则。','Repository 负责执行 SQL，不处理 HTTP。','用简单单元测试验证有效和空白标题；不要只依赖启动成功。'],code:JAVA_SERVICE},{title:'连接 HTTP 接口',steps:['保存 TaskController.java，运行 .\\mvnw.cmd spring-boot:run。','用 PowerShell Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8080/tasks -ContentType application/json -Body \'{"title":"Study"}\' 创建任务。','调用 GET /tasks；提交空白标题应被拒绝。重启后再次查询，验证持久化。'],code:JAVA_CONTROLLER}],checks:['创建请求返回 201','列表包含创建记录','空白标题得到客户端错误','重启后记录保留','能解释三个层次与依赖方向','能够指出参数绑定位置'],challenge:'增加完成任务接口，使用受影响行数识别不存在的 id；补充集成测试，确保 404 与成功响应都符合契约。'},
{id:'spring-ai-tutor',title:'接入真实模型的编程小助教',level:'进阶 · Spring AI',tags:['ChatClient','本机模型','输入校验','评估'],desc:'把模型接入 Java 服务，并记录真实效果与失败情况。',prereq:'Spring Boot 项目、Spring AI 五课；可用本机模型服务或已授权的云端模型。',deliverable:'一个解释编程概念的 POST 接口、固定评估题集和失败处理记录。模型质量取决于实际选择，不能只凭接通就称为可靠助教。',stages:[{title:'选择可用模型与生成项目',steps:['以本机路线为例：从 Ollama 官方站点安装，选择适合电脑资源的模型，按官方命令下载并确认可本机对话。','在 Initializr 生成 com.example/demo 项目，添加 Spring Web、Validation、Ollama 模型集成，核对 Spring AI 稳定版本。','本指南配置按 Spring AI 2.x 文档编写；若生成器给出其他主版本，以该版本文档确认属性，不混用。'],code:`# PowerShell：模型名称填 ollama list 中的完整实际名称
$env:MODEL_NAME="填入已下载的模型名称"

# application.properties
spring.ai.ollama.base-url=http://localhost:11434
spring.ai.ollama.chat.model=\${MODEL_NAME}
spring.ai.ollama.chat.temperature=0.2`},{title:'实现最小接口',steps:['把下列 TutorController.java 放到启动类同包。','运行 .\\mvnw.cmd spring-boot:run。','向 POST /explain 提交 {"topic":"什么是变量"}，观察真实响应并记录耗时。'],code:`package com.example.demo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
public class TutorController {
    private final ChatClient chat;
    public TutorController(ChatClient.Builder builder) {
        this.chat = builder.defaultSystem("你是中文编程助教。用简短例子解释概念，不确定时直说。").build();
    }
    public record Topic(@NotBlank @Size(max=200) String topic) {}
    @PostMapping("/explain")
    public Map<String,String> explain(@Valid @RequestBody Topic input) {
        String text = chat.prompt().user(input.topic()).call().content();
        if (text == null || text.isBlank()) {
            throw new IllegalStateException("模型未返回有效文本");
        }
        return Map.of("answer", text);
    }
}`},{title:'让失败成为可检查结果',steps:['编写十个固定题目：变量、循环、函数、SQL 条件等，并保留预期知识点。','暂时停止模型服务，记录错误如何传播；增加统一错误处理与超时配置。','比较模型输出与官方资料，标注错误和不确定答案；不把网页通了当作质量达标。']}],checks:['至少完成一次真实模型调用','能追踪 Controller 到提供方的调用','输入长度与空白限制生效','模型不可用时有明确失败表现','十道题逐项核对结果','配置中没有硬编码云端密钥'],challenge:'增加依据文档回答并带来源的功能。先用五份小文档验证检索，再逐步扩大规模，记录召回与回答错误的区别。'},
{id:'bounded-agent',title:'有边界的资料查询 Agent',level:'进阶 · Agent',tags:['工具注册','引用','状态','步数上限'],desc:'先用确定性模拟模型搭出可靠流程，再替换真实模型适配器。',prereq:'Agent 六课与 Python 测试。',deliverable:'一个可追踪的工具调用循环、已知与未知问题测试、执行上限；模拟模式必须明确标注。',stages:[{title:'搭建最小闭环',steps:['新建 agent.py，把示例作为对照；先自己实现 search。','确认 query、evidence、trace 三个状态字段的含义。','运行 py agent.py，观察已知与未知问题。'],code:AGENT_REFERENCE},{title:'为边界写测试',steps:['新建 test_agent.py，验证引用、拒答和步数上限。','修改模拟模型使它提出未知工具，确认执行器拒绝。','将 trace 写入复盘报告，不记录敏感用户内容。'],code:`from agent import run
def test_known():
    assert "[python-1]" in run("Python")["answer"]
def test_unknown():
    assert run("火星天气")["answer"] == "没有足够证据"
def test_budget():
    assert "步数上限" in run("Python", max_steps=1)["answer"]
`},{title:'替换模型时保留可靠边界',steps:['把 mock_model 提取为可注入函数，让 run 接受 model 参数。','再接入你已经验证的真实模型，输出必须解析为受限工具名称和参数。','保留同一组测试，再增加非法结构、超时与不可信文档指令案例。']}],checks:['模拟模式清楚标识','已知问题包含来源','未知问题不编造','未知工具被拒绝','循环达到上限会停止','真实模型接入时不绕过参数校验'],challenge:'增加检索评价与人工批准写操作的状态；比较模拟与真实模型模式的成功率、耗时和费用。'},
{id:'multi-agent-report',title:'研究、撰写、复核协作流水线',level:'进阶 · 多 Agent',tags:['角色契约','去重','状态机','复核'],desc:'用三个可替换角色完成有来源的简报，比较单角色与多角色方案。',prereq:'Agent、多 Agent 全部小节。',deliverable:'先完成不调用模型的确定性多角色工作流，再按需接入模型；包含状态记录、来源校验和失败处理。',stages:[{title:'定义角色与交接格式',steps:['研究角色返回 facts 与 sources。写作角色生成结构化段落。复核角色检查引用是否存在。','先约定不知道或失败时的结果，不让下一角色猜测。','新建 workflow.py，先使用确定性角色函数验证流程。'],code:`def research(documents):
    seen, facts = set(), []
    for doc in documents:
        if doc["id"] not in seen:
            seen.add(doc["id"])
            facts.append({"text": doc["text"], "source": doc["id"]})
    return facts

def write(facts):
    return [{"text": f["text"], "citation": f["source"]} for f in facts]

def review(draft, documents):
    by_id = {d["id"]: d["text"] for d in documents}
    return bool(draft) and all(
        p["citation"] in by_id and p["text"] == by_id[p["citation"]]
        for p in draft
    )

def run(documents):
    trace = []
    facts = research(documents); trace.append("research")
    draft = write(facts); trace.append("write")
    passed = review(draft, documents); trace.append("review")
    return {"draft": draft, "approved": passed, "trace": trace}

if __name__ == "__main__":
    print(run([{"id":"d1","text":"本周完成三项任务"}]))`},{title:'测试失败和冲突',steps:['测试空文档必须不能通过复核。','手工篡改草稿来源或正文，确认复核拒绝。','本例用原文等值比较，不支持改写后的语义忠实性判断；接入模型后需要额外评估。'],code:`from workflow import run, review
def test_empty():
    assert run([])["approved"] is False
def test_fake_source():
    assert review([{"text":"a","citation":"fake"}], [{"id":"d1","text":"a"}]) is False
def test_altered_text():
    assert review([{"text":"b","citation":"d1"}], [{"id":"d1","text":"a"}]) is False
`},{title:'再判断是否值得增加 Agent',steps:['让三个角色共用同一模型或使用不同模型，但维持交接格式。','为每个角色记录耗时、输入输出标识和错误。','用相同十个任务对比单流程与多角色方案；只有质量或维护性收益明确时才保留复杂度。']}],checks:['三个角色输入输出清楚','空证据不通过复核','伪造来源和改写原文能被发现','状态顺序可追踪','明确区分模拟与真实模型','比较过复杂度与收益'],challenge:'并行执行两个研究来源，再去重汇总；加入最多两次复核修订，记录预算与每次失败原因。'},
{id:'capstone-own',title:'毕业 A · 接管自己的 AI 项目',level:'毕业验收 · 自己的项目',capstone:true,tags:['逐行解释','AI 代码审查','独立改动','故障修复'],desc:'证明你可以维护自己负责的代码，即使它最初由 AI 生成。',prereq:'完成至少一条后端路线、Agent 项目、AI 代码接管与复杂工程课程。',deliverable:'一个个人学习助手：任务 API、持久化、资料检索、带引用回答和评估。允许 AI 辅助；关键业务代码需要逐句解释，未知依赖要有查证记录。',stages:[{title:'先写范围，再让 AI 参与',steps:['选择 Python/FastAPI 或 Java/Spring 主栈；明确本期必做功能，不同时重写两套后端。','写至少五条可执行验收：创建、筛选、重启持久化、未知问题拒答、来源可追溯。','把需求拆成小改动；每次记录 AI 提议、你接受什么、拒绝什么。']},{title:'建立代码理解账本',steps:['列出所有自己项目的源文件，说明它们存在的原因。','对关键业务链路逐句解释：语法、变量、分支、输入输出、副作用、异常与调用关系。','对不懂的依赖调用查询对应版本文档，做最小实验；无法解释的关键代码不得标记通过。'],code:`文件 / 函数：
对应需求：
逐句解释：
输入和边界：
返回与副作用：
调用方与依赖：
正常测试：
失败测试：
未知项与验证证据：`},{title:'不依赖 AI 完成一次修改',steps:['暂时不使用 AI 生成代码，独立添加“任务关键词与完成状态联合筛选”。','先写测试，再修改；解释每一处 diff 和对旧客户端的影响。','可查官方文档，但记录查询内容；能查证不是失败，无法解释才是未掌握。']},{title:'进行故障答辩',steps:['制造 false 筛选失效、重复创建、模型超时或错误引用中的一个故障。','先复现并写失败测试，再定位并修复，保留前后结果。','从一次用户操作开始，口头讲清请求、业务、数据库、模型、响应全过程，解释每个关键函数。']},{title:'按证据评分，不能用勾选代替证明',steps:['每项 0～3 分：0 无证据；1 跟着答案做；2 查文档后能独立解释和完成；3 能换需求、测边界并迁移。','五项分别评分：逐句理解、端到端追踪、独立修改、故障修复、回归与交付。总分至少 12/15 且每项不低于 2，才记录自查达标。','保存 README、结构图、理解账本、测试结果、故障记录和 commit；最好请另一位开发者抽查，不把网站自查当成第三方认证。']}],checks:['能解释所有自写或 AI 生成的关键业务代码，未知项有查证记录','能完整追踪一次包含数据库和模型的业务流程','独立完成新需求并解释全部 diff','故障有先失败后通过的测试证据','干净环境可复现并具备交付说明','五项评分均不低于 2 且总分达到 12'],challenge:'把模型提供方或持久化实现替换掉，保持公开接口测试通过。用新的变化检验你掌握的是结构与契约，而不只是记住代码。'},
{id:'capstone-repo',title:'毕业 B · 接手陌生 GitHub 仓库',level:'毕业验收 · 陌生项目',capstone:true,tags:['复现运行','结构图','核心调用链','小改动'],desc:'在没有现成讲解的情况下，完成一份可复核的项目分析与改动。',prereq:'源码阅读八课，至少完成一项后端项目；选与已学主栈相近但没读过的公开仓库。',deliverable:'固定提交下的源码分析报告、真实运行证据、模块结构图、一条核心调用链、五张函数理解卡、一个小改动和测试结果。',stages:[{title:'选一个真正陌生、可复现的项目',steps:['练习先使用 spring-guides/gs-rest-service；正式验收另选未读过、带 README 和测试的项目。','优先选择单服务、中小规模仓库；记录为何选择与暂不覆盖的领域。','固定 commit，阅读许可证和安装步骤，记录语言与依赖版本。']},{title:'复现并建立结构地图',steps:['按照 README 在独立目录安装，运行最小示例；问题按构建、配置、运行分组记录。','画模块职责图与依赖箭头，不只复制目录树。','每个关键模块标明文件与符号；无法运行部分如实记录，不把它列为已验证。']},{title:'追踪、解释与核对',steps:['选一个真实请求或命令，追踪到数据访问或外部调用，再追到输出。','为五个关键函数写理解卡，并为其中一个 20～50 行函数逐句解释。','先预测正常、边界和错误三种结果，再通过测试、断点或日志核对。']},{title:'完成一个有边界的小改动',steps:['在本地新分支增加一个参数、一个筛选或一个明确校验；先写新旧行为对照。','增加回归用例，完成最小改动，运行原有和新增测试。','逐处解释 diff；无需向上游发 PR，发布不是本验收的必要条件。']},{title:'交付与复核标准',steps:['评分五项：可复现运行、结构准确、调用链与函数解释、小改动质量、证据与局限。每项 0～3 分。','2 分表示查资料后能独立完成并有证据；3 分表示还能处理变式。每项至少 2，总分至少 12/15。','分析报告要明确已验证、合理推断、尚未理解；再选第二个不同风格仓库重复一次，检验方法能否迁移。'],code:`# 陌生项目分析报告
仓库 URL：
固定 commit：
项目用途与用户：
技术栈及版本证据：
复现环境和启动命令：
实际运行结果：
目录与模块职责图：
核心入口和调用链：
关键函数理解卡（至少五个）：
预测与实际结果对照：
原有测试和覆盖缺口：
本次需求及小改动 diff：
新增与回归测试结果：
未理解部分及查证计划：
五项评分与证据位置：`}],checks:['已固定版本并实际跑通目标功能','结构图每个关键模块都有源码证据','核心流程已通过运行或断点验证','五张函数理解卡且一处完成逐句解释','小改动有新增与回归测试结果','报告明确未知部分，评分达到标准'],challenge:'换一个相邻但不熟悉的技术栈，先补最小语言知识，再重复同样分析方法。区分“暂时不懂”和“没有能力查清”，持续扩大能力范围。'}
);

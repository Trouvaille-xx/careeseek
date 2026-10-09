# CareeSeek 演示数据生成脚本
# 用法: pwsh -File generate-demo-data.ps1
# 说明: 产出 CareeSeek_演示数据.xlsx (多 sheet)。所有人物/公司/数据均为虚构，仅供功能演示与测试。
$ErrorActionPreference = 'Stop'

$outDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$outPath = Join-Path $outDir 'CareeSeek_演示数据.xlsx'

# ============ 演示人物与 JD ============
$JD1 = @'
岗位职责：
1. 负责 AI 对话/智能助手类产品的需求分析、产品规划与版本迭代管理
2. 深入理解大模型（LLM）能力边界，设计创新性 AI 产品功能与交互范式
3. 协调算法、工程、设计、运营等多团队完成产品按时交付
4. 建立并跟踪产品数据指标体系，用数据驱动功能优化与用户体验提升
5. 跟踪大模型行业趋势与竞品动态，输出产品策略与路线图报告

任职要求：
1. 统招本科及以上学历，计算机、人工智能等相关专业优先
2. 5 年以上互联网产品经理经验，其中 2 年以上 AI/智能产品经验
3. 具备优秀的产品设计能力，熟练使用 Figma、Axure、XMind 等工具
4. 具备良好的数据分析能力，熟悉 SQL，掌握 Python 者优先
5. 具备较强的主人翁意识与自驱力，善于跨团队沟通与项目管理

加分项：
- 有大模型产品（对话/Agent/RAG）落地经验
- 有 ToB 企业级 AI 解决方案经验
- 有技术背景，理解机器学习基本原理
'@

$JD2 = @'
岗位职责：
1. 负责 ToB SaaS 产品线的需求调研、产品规划与商业化落地
2. 深入客户业务场景，梳理标准化需求并输出 PRD
3. 协同销售、售前、研发、交付团队推动产品从立项到上线
4. 设计产品定价与打包策略，跟进续费与增购转化
5. 建立产品运营数据看板，持续提升活跃与留存

任职要求：
1. 统招本科及以上学历，专业不限，计算机/商科优先
2. 3 年以上产品经验，有 ToB SaaS 或企业软件背景
3. 具备较强的需求分析与抽象能力，能面向不同行业提炼共性方案
4. 熟悉 SQL，具备基础数据分析与竞品分析能力
5. 良好的跨团队沟通与项目推进能力

加分项：
- 有从 0 到 1 的 SaaS 产品商业化经验
- 有项目管理（PMP/Scrum）经验
'@

$JD3 = @'
岗位职责：
1. 负责用户增长与商业化相关业务的数据分析，搭建核心指标体系
2. 设计并分析 A/B 实验，为产品与运营决策提供数据依据
3. 输出专题分析报告，洞察用户行为并给出增长建议
4. 建设可视化看板，推动数据口径统一与取数效率提升
5. 与产品、运营、研发协作，闭环跟进实验与策略效果

任职要求：
1. 统招本科及以上学历，统计学、数学、计算机相关专业
2. 1-3 年数据分析经验，优秀应届生亦可
3. 熟练使用 SQL、Excel，掌握 Python/R 或 BI 工具（Tableau/PowerBI）之一
4. 具备良好的数据敏感度与逻辑表达，能独立完成分析报告
5. 了解常用统计方法（显著性检验、回归等）者优先

加分项：
- 有大用户量级平台数据分析经验
- 有 A/B 实验平台使用经验
'@

# ============ 简历全文（供 “步骤1 分析” 使用）============
$RESUME1 = @'
个人简介
5 年互联网产品经验，其中 2 年深耕 AI 方向，专注大模型应用对话与智能助手产品。主导过 2 个从 0 到 1 的 AI 产品落地，分别在客服效率和内部知识库场景产生了可量化的业务提升。擅长产品规划、需求抽象、数据驱动迭代与跨团队协同。

工作经历
乐行智能科技（深圳）有限公司 | AI 产品经理 | 2023.04 - 至今
- 负责企业级 AI 客服与智能助手产品线，管理需求池、版本规划与发布节奏
- 设计多轮对话与意图路由策略，与算法团队共建评测集，意图识别准确率由 81% 提升至 92%
- 主导接入大模型（RAG + 会话记忆）改造知识检索链路，问题一次解决率提升 18 个百分点
- 建立产品数据看板（PV/UV、会话数、解决率、转人工率），据此驱动 6 个版本的功能取舍

智联信息科技（北京）有限公司 | 产品经理 | 2020.07 - 2023.03
- 负责 B 端客服工作台产品，覆盖工单、质检、知识库模块，完成约 30 个功能迭代交付
- 深入 40+ 企业客户一线调研，沉淀标准需求清单，输出需求文档累计 60 余份
- 参与搭建产品埋点与数据分析体系，为决策提供数据支撑

教育背景
华南理工大学 | 计算机科学与技术 | 本科 | 2016 - 2020

项目经验
企业智能客服助手（大模型方向）
- 作为产品负责人定义场景边界与 MVP 范围，推动从 0 到 1 上线
- 设计知识库切分、检索排序与答案兜底的多轮交互逻辑，降低无效会话
- 组织 12 家试点客户灰度，依据反馈迭代提示词模板与评测口径
- 上线后客服团队单次会话平均处理时长下降 26%

技能
- 产品设计：Figma、Axure、XMind、ProcessOn
- 数据分析：SQL、Excel、Tableau
- AI 相关：Prompt Engineering、RAG 应用设计、模型效果评测
- 协作：Scrum、Jira、Confluence
'@

$RESUME2 = @'
个人简介
3 年 ToB 产品经验，专注企业协同与 SaaS 软件方向。主导多轮针对制造业、连锁零售客户的业务调研与方案抽象，推动产品由“定制交付”向“标准化+配置化”演进。擅长需求分析、竞品研究与跨团队项目管理。

工作经历
启点云（上海）科技有限公司 | 高级产品经理 | 2021.08 - 至今
- 负责客户成功与工单协同 SaaS 产品，梳理 30+ 客户场景，抽象为可复用的模块化需求
- 推动产品从纯定制到“标准版+行业配置包”，标准版月活提升 35%
- 设计定价与打包策略，配合销售完成 5 个标杆客户的商业化落地
- 建立产品运行数据看板，续费率由 80% 提升至 88%

微格网络（杭州）有限公司 | 产品专员 | 2019.07 - 2021.07
- 负责官网与用户后台的需求整理、原型设计与上线跟进，交付 20 余个功能模块
- 参与竞品分析与客户回访，输出月度产品分析简报

教育背景
浙江工业大学 | 信息管理与信息系统 | 本科 | 2015 - 2019

项目经验
客户成功 SaaS 平台标准化改造
- 主导需求抽象与配置化改造方案，输出标准需求文档与配置清单
- 与研发、交付团队协作，将单体交付周期缩短约 30%
- 设计续费与增购关键指标，建立客户健康度看板

技能
- 产品设计：Axure、Figma、Visio
- 数据分析：SQL、Excel
- 协作：PMP 方法论、Jira、Confluence
'@

$RESUME3 = @'
个人简介
数据分析方向，1 年多项目经验（含实习），擅长用户增长与商业化分析。具备从取数、清洗到建模、可视化的闭环能力，能独立产出高质量分析报告并推动落地。

项目经历
某内容平台用户增长分析（实习，2023.04 - 2023.09）
- 搭建“新增-激活-留存-付费”漏斗指标体系，输出用户流失节点分析
- 设计并跟进 4 轮 A/B 实验（如新人任务、push 文案），实验组次日留存提升 9%
- 用 SQL 提取并清洗千万级行为数据，配合 Python 完成趋势与分群分析
- 输出看板与月度增长报告，供运营与产品例会使用

教育背景
华中科技大学 | 统计学 | 本科 | 2019 - 2023

技能
- 数据分析：SQL、Python（pandas）、Excel
- 可视化：Tableau、Power BI、DataFocus
- 统计：显著性检验、回归分析
'@

# ============ 简历库结构化（人物：林晓）============
$basic = @('林晓','138-0000-1234','lin.xiao@example.com','深圳','AI 产品经理（高级）','','5 年互联网产品经验，2 年 AI 方向，主导 2 个从 0 到 1 的 AI 产品落地')
$edu = @(
 @('林晓','华南理工大学','计算机科学与技术','本科','2016-09','2020-06','主修数据结构、机器学习导论，毕业设计为智能对话系统原型'),
 @('林晓','华南理工大学','计算机科学与技术','本科','2016-09','2020-06','获得校级优秀毕业生')
)
$work = @(
 @('林晓','乐行智能科技（深圳）有限公司','AI 产品经理','2023-04','至今','负责企业级 AI 客服与智能助手产品线；设计多轮对话与意图路由策略，意图识别准确率由 81% 提升至 92%；主导接入大模型(RAG)知识检索，问题一次解决率提升 18 个百分点；建立数据看板驱动 6 个版本功能取舍'),
 @('林晓','智联信息科技（北京）有限公司','产品经理','2020-07','2023-03','负责 B 端客服工作台（工单/质检/知识库）约 30 个功能交付；深入 40+ 企业客户调研，沉淀标准需求清单；参与搭建产品埋点与数据分析体系')
)
$proj = @(
 @('林晓','企业智能客服助手（大模型方向）','产品负责人','2023-05','至今','定义场景边界与 MVP 范围，推动从 0 到 1 上线；设计知识库切分、检索排序与答案兜底交互；组织 12 家试点灰度迭代提示词与评测口径；上线后单次会话平均处理时长下降 26%'),
 @('林晓','知识库问答机器人（RAG 试点）','产品经理','2022-09','2023-02','面向企业内部知识和 FAQ 场景设计 RAG 问答机器人；梳理知识库切分规则与答案置信度兜底；联动算法团队建立评测集，首轮问答准确率达标 85%')
)
$skill = @(
 @('林晓','产品设计','Figma, Axure, XMind, ProcessOn'),
 @('林晓','数据分析','SQL, Excel, Tableau'),
 @('林晓','AI 相关','Prompt Engineering, RAG 应用设计, 模型效果评测'),
 @('林晓','协作','Scrum, Jira, Confluence')
)
$strength = @(
 @('林晓','擅长把模糊业务问题抽象为可量化、可落地的产品方案'),
 @('林晓','具备较强的数据驱动产品迭代与跨团队项目管理经验')
)
$custom = @(
 @('林晓','证书荣誉','PMP 项目管理证书','PMI','2022-06'),
 @('林晓','语言能力','英语 CET-6','大学英语六级','2021-12')
)

# ============ 投递跟踪（人物：林晓）============
$apps = @(
 @('字节跳动 - 飞书','AI 产品经理（对话）','interview','内推','https://jobs.bytedance.com','已进二面','82','2025-11-05'),
 @('阿里云','智能客服产品经理','written_test','BOSS直聘','','笔试通知','76','2025-11-03'),
 @('腾讯云','AI 产品经理','applied','官网','','','70','2025-11-01'),
 @('商汤科技','大模型应用产品经理','rejected','LinkedIn','','岗位关闭','64','2025-10-28'),
 @('百度智能云','对话机器人产品经理','applied','内推','https://talent.baidu.com','','73','2025-10-25'),
 @('MiniMax','产品经理（AI 助手）','offer','官网','https://platform.minimaxi.com','口头 offer','88','2025-10-20'),
 @('讯飞开放平台','AI 产品经理','draft','BOSS直聘','','准备简历','0','2025-11-06')
)
$appEvents = @(
 @('字节跳动 - 飞书','interview','一面','业务负责人视频面','2025-11-06'),
 @('字节跳动 - 飞书','interview','二面','产品总监面','2025-11-09'),
 @('阿里云','written_test','笔试','产品综合题','2025-11-04'),
 @('MiniMax','offer','口头 offer','已确认薪资','2025-10-21')
)

# ============ 组表工具 ============
function Write-Sheet($SheetName, $Headers, $Rows) {
    $xl = New-Object -ComObject Excel.Application
    $xl.Visible = $false
    $xl.DisplayAlerts = $false
    try {
        $wb = $xl.Workbooks.Add()
        $ws = $wb.Worksheets.Item(1)
        $ws.Name = $SheetName
        # 表头
        $h = New-Object 'object[,]' -ArgumentList 1, $Headers.Count
        for ($i=0; $i -lt $Headers.Count; $i++) { $h[0,$i] = [string]$Headers[$i] }
        $rng = $ws.Range($ws.Cells.Item(1,1), $ws.Cells.Item(1,$Headers.Count))
        $rng.Value2 = $h
        $rng.Font.Bold = $true
        $rng.Interior.Color = 15921906
        # 数据
        for ($r=0; $r -lt $Rows.Count; $r++) {
            $row = $Rows[$r]
            $n = $row.Count
            $arr = New-Object 'object[,]' -ArgumentList 1, $n
            for ($c=0; $c -lt $n; $c++) { $arr[0,$c] = [string]$row[$c] }
            $rng2 = $ws.Range($ws.Cells.Item($r+2,1), $ws.Cells.Item($r+2,$n))
            $rng2.Value2 = $arr
        }
        $ws.Cells.EntireColumn.AutoFit() | Out-Null
        $ws.Range($ws.Cells.Item(1,1), $ws.Cells.Item($Rows.Count+1,$Headers.Count)).WrapText = $true
        $wb.SaveAs($outPath, 51)
        $wb.Close($false)
        Write-Host "sheet ok: $SheetName ($($Rows.Count) rows)"
    } finally {
        $xl.Quit()
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($xl) | Out-Null
    }
}

$xl = New-Object -ComObject Excel.Application
$xl.Visible = $false
$xl.DisplayAlerts = $false
try {
    $wb = $xl.Workbooks.Add()
    # 说明
    $ws0 = $wb.Worksheets.Item(1); $ws0.Name = '说明'
    $readme = @(
     'CareeSeek 演示/测试数据（多 sheet）',
     '用途：简历分析（步骤1→8）、简历库/简历制作、投递跟踪等模块的功能演示与 UI 测试。',
     '声明：本文件所有人物、公司、项目与数据均为虚构，仅供演示，请勿当作真实简历投递。',
     '如何用：',
     '  1) 复制「02-原始简历全文」的简历文本，粘贴到网页 步骤1 的“原始简历”输入框；',
     '      同时把「01-求职目标与JD」对应行的 JD 文本粘贴到“JD 原文”，即可跑一次完整分析。',
     '  2) 简历库各表（03A-03G）对应应用“简历库/简历制作”里的结构化字段，可手动录入或用于导入测试。',
     '  3) 「04A-投递跟踪」「04B-投递事件」对应“投递跟踪”模块。',
     '  sheet 表头字段与 src/types/index.ts 中的类型字段一一对应，便于开发者写导入逻辑。'
    )
    $rs = New-Object 'object[,]' -ArgumentList $readme.Count, 1
    for ($i=0;$i -lt $readme.Count;$i++){ $rs[$i,0]=$readme[$i] }
    $ws0.Range($ws0.Cells.Item(1,1), $ws0.Cells.Item($readme.Count,1)).Value2 = $rs
    $ws0.Columns.Item(1).ColumnWidth = 110

    $addRow = {
        param($name,$headers,$rows)
        $ws = $wb.Worksheets.Add([System.Reflection.Missing]::Value, $wb.Worksheets.Item($wb.Worksheets.Count))
        $ws.Name = $name
        $h = New-Object 'object[,]' -ArgumentList 1, $headers.Count
        for ($i=0;$i -lt $headers.Count;$i++){ $h[0,$i]=[string]$headers[$i] }
        $ws.Range($ws.Cells.Item(1,1),$ws.Cells.Item(1,$headers.Count)).Value2 = $h
        $ws.Range($ws.Cells.Item(1,1),$ws.Cells.Item(1,$headers.Count)).Font.Bold = $true
        for ($r=0;$r -lt $rows.Count;$r++){
            $row = $rows[$r]; $n=$row.Count
            $arr = New-Object 'object[,]' -ArgumentList 1,$n
            for ($c=0;$c -lt $n;$c++){ $arr[0,$c]=[string]$row[$c] }
            $ws.Range($ws.Cells.Item($r+2,1),$ws.Cells.Item($r+2,$n)).Value2 = $arr
        }
        $ws.Cells.EntireColumn.AutoFit() | Out-Null
        $ws.Range($ws.Cells.Item(1,1),$ws.Cells.Item($rows.Count+1,$headers.Count)).WrapText = $true
    }

    & $addRow '01-求职目标与JD' @('数据ID','人物','目标岗位','目标行业','目标公司类型','求职阶段','希望突出','JD原文(jdContent)','补充信息(supplementInfo)') @(
      @('A','林晓','AI 产品经理（高级）','人工智能 / SaaS','独角兽 / 大厂','3-5 年经验','AI 产品能力、数据驱动、项目管理、大模型应用','',''),
      @('B','周明','ToB SaaS 产品经理','企业服务 / SaaS','ToB SaaS 公司 / 中型企业','3-5 年经验','商业化落地、需求抽象、客户成功','',''),
      @('C','陈雨桐','数据分析师（用户增长）','互联网 / 内容平台','互联网大厂 / 创业公司','应届 / 1-3 年','数据分析、A/B 实验、增长策略','','')
    )

    & $addRow '02-原始简历全文' @('数据ID','人物','简历文本(resumeContent)','备注') @(
      @('A','林晓',$RESUME1,'AI 产品经理方向，5 年经验，虚构'),
      @('B','周明',$RESUME2,'ToB SaaS 方向，3 年经验，虚构'),
      @('C','陈雨桐',$RESUME3,'数据分析方向，应届/1 年，虚构')
    )

    & $addRow '03A-基本信息' @('人物','姓名','电话','邮箱','城市','求职意向','网站','个人摘要') @( ,$basic )

    & $addRow '03B-教育' @('人物','学校','专业','学历','开始','结束','描述') $edu
    & $addRow '03C-工作经历' @('人物','公司','职位','开始','结束','描述(职责与成果)') $work
    & $addRow '03D-项目' @('人物','项目名','角色','开始','结束','描述') $proj
    & $addRow '03E-技能' @('人物','分类','技能') $skill
    & $addRow '03F-自我评价' @('人物','内容') $strength
    & $addRow '03G-自定义模块' @('人物','模块','条目标题','说明','时间/等级') $custom

    & $addRow '04A-投递跟踪' @('公司','职位','状态','渠道','JD链接','备注','匹配分','投递时间') $apps
    & $addRow '04B-投递事件' @('关联公司','类型','标题','说明','日期') $appEvents

    $wb.SaveAs($outPath, 51)
    $wb.Close($false)
    Write-Host "Created: $outPath"
} finally {
    $xl.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($xl) | Out-Null
    [GC]::Collect()
}

import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { MonthPicker } from '@/components/ui/MonthPicker';
import type { EducationEntry, WorkExperienceEntry, ProjectEntry, CoreSkillEntry, BasicInfoEntry, PersonalStrengthEntry } from '@/types';

function genId() { return Math.random().toString(36).slice(2, 10); }

type ModuleKey = 'basicInfo' | 'education' | 'personalStrengths' | 'workExperience' | 'projects' | 'coreSkills';

const emptyEdu = (): EducationEntry => ({ id: genId(), school: '', major: '', degree: '', startDate: '', endDate: '', description: '', status: 'approved' });
const emptyWork = (): WorkExperienceEntry => ({ id: genId(), company: '', position: '', startDate: '', endDate: '', description: '', status: 'approved' });
const emptyProj = (): ProjectEntry => ({ id: genId(), name: '', role: '', startDate: '', endDate: '', description: '', status: 'approved' });
const emptySkill = (): CoreSkillEntry => ({ id: genId(), category: '', skills: '', status: 'approved' });
const emptyStrength = (): PersonalStrengthEntry => ({ id: genId(), content: '', status: 'approved' });
const emptyBasicInfo = (): BasicInfoEntry => ({ name: '', phone: '', email: '', city: '', jobIntent: '', website: '', summary: '' });

const MODULES: { key: ModuleKey; title: string; desc: string; icon: React.ReactNode; isList: boolean }[] = [
  { key: 'basicInfo', title: '基本信息', desc: '姓名、联系方式、求职意向', icon: <PersonIcon />, isList: false },
  { key: 'education', title: '教育背景', desc: '学校、专业、学历', icon: <EduIcon />, isList: true },
  { key: 'personalStrengths', title: '个人优势', desc: '核心优势与亮点', icon: <StarIcon />, isList: true },
  { key: 'workExperience', title: '工作经验', desc: '公司、职位、时间线', icon: <WorkIcon />, isList: true },
  { key: 'projects', title: '项目经历', desc: '项目名称、角色、成果', icon: <ProjectIcon />, isList: true },
  { key: 'coreSkills', title: '专业技能', desc: '技能分类与清单', icon: <SkillIcon />, isList: true },
];

export function ResumeLibraryPage() {
  const {
    resumeLibrary,
    setBasicInfo,
    addEducation, updateEducation, deleteEducation,
    addWorkExperience, updateWorkExperience, deleteWorkExperience,
    addProject, updateProject, deleteProject,
    addCoreSkill, updateCoreSkill, deleteCoreSkill,
    addPersonalStrength, updatePersonalStrength, deletePersonalStrength,
  } = useAppStore();

  const [expandedModules, setExpandedModules] = useState<Record<ModuleKey, boolean>>({
    basicInfo: true, education: false, personalStrengths: false, workExperience: false, projects: false, coreSkills: false,
  });
  const [activeModule, setActiveModule] = useState<ModuleKey>('basicInfo');

  const selectModule = (key: ModuleKey) => {
    setActiveModule(key);
    setExpandedModules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const counts: Record<ModuleKey, number> = {
    basicInfo: resumeLibrary.basicInfo ? 1 : 0,
    education: resumeLibrary.education?.length ?? 0,
    personalStrengths: resumeLibrary.personalStrengths?.length ?? 0,
    workExperience: resumeLibrary.workExperience?.length ?? 0,
    projects: resumeLibrary.projects?.length ?? 0,
    coreSkills: resumeLibrary.coreSkills?.length ?? 0,
  };

  const editorProps = {
    library: resumeLibrary,
    onSetBasicInfo: setBasicInfo,
    onUpdateEdu: updateEducation,
    onDeleteEdu: deleteEducation,
    onUpdateWork: updateWorkExperience,
    onDeleteWork: deleteWorkExperience,
    onUpdateProject: updateProject,
    onDeleteProject: deleteProject,
    onUpdateSkill: updateCoreSkill,
    onDeleteSkill: deleteCoreSkill,
    onUpdateStrength: updatePersonalStrength,
    onDeleteStrength: deletePersonalStrength,
    onAdd: (key: ModuleKey) => {
      switch (key) {
        case 'education': addEducation(emptyEdu()); break;
        case 'workExperience': addWorkExperience(emptyWork()); break;
        case 'projects': addProject(emptyProj()); break;
        case 'coreSkills': addCoreSkill(emptySkill()); break;
        case 'personalStrengths': addPersonalStrength(emptyStrength()); break;
      }
    },
  };

  return (
    <div className="animate-fade-in flex gap-4 h-full min-h-[calc(100vh-8rem)]">
      {/* Left: simple menu list */}
      <div className="w-56 shrink-0 space-y-1">
        {MODULES.map((m) => {
          const isActive = activeModule === m.key;
          return (
            <button
              key={m.key}
              onClick={() => selectModule(m.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                isActive
                  ? 'border-primary-200 bg-primary-50/60'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isActive ? 'bg-primary-100 text-primary-600' : 'bg-slate-50 text-slate-400'
              }`}>
                {m.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isActive ? 'text-primary-700' : 'text-slate-800'}`}>{m.title}</p>
                <p className="text-[11px] text-slate-400 truncate">{m.desc}</p>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{counts[m.key]}</span>
            </button>
          );
        })}
      </div>

      {/* Right: only the active module */}
      <div className="flex-1 min-w-0 bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-y-auto scrollbar-thin">
        <ActiveModuleEditor moduleKey={activeModule} {...editorProps} />
      </div>
    </div>
  );
}

function CollapsibleSection({
  title, icon, count, expanded, onToggle, onAdd, children,
}: {
  title: string; icon: React.ReactNode; count: number; expanded: boolean; onToggle: () => void; onAdd?: () => void; children: React.ReactNode;
}) {
  return (
    <div className={`bg-white rounded-xl border transition-all ${expanded ? 'border-slate-200' : 'border-slate-200'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onToggle} className="flex items-center gap-3 flex-1 text-left">
          <span className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">{icon}</span>
          <span className="text-sm font-medium text-slate-900 flex-1">{title}</span>
          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{count}</span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expanded && onAdd && (
          <Button variant="ghost" size="sm" onClick={onAdd} className="shrink-0">
            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            新增
          </Button>
        )}
      </div>
      {expanded && (
        <div className="px-4 pb-4 animate-fade-in">{children}</div>
      )}
    </div>
  );
}

function ActiveModuleEditor({
  moduleKey, library,
  onSetBasicInfo,
  onUpdateEdu, onDeleteEdu,
  onUpdateWork, onDeleteWork,
  onUpdateProject, onDeleteProject,
  onUpdateSkill, onDeleteSkill,
  onUpdateStrength, onDeleteStrength,
  onAdd,
}: {
  moduleKey: ModuleKey;
  library: ReturnType<typeof useAppStore.getState>['resumeLibrary'];
  onSetBasicInfo: (info: BasicInfoEntry) => void;
  onUpdateEdu: (id: string, e: EducationEntry) => void;
  onDeleteEdu: (id: string) => void;
  onUpdateWork: (id: string, e: WorkExperienceEntry) => void;
  onDeleteWork: (id: string) => void;
  onUpdateProject: (id: string, e: ProjectEntry) => void;
  onDeleteProject: (id: string) => void;
  onUpdateSkill: (id: string, e: CoreSkillEntry) => void;
  onDeleteSkill: (id: string) => void;
  onUpdateStrength: (id: string, e: PersonalStrengthEntry) => void;
  onDeleteStrength: (id: string) => void;
  onAdd: (key: ModuleKey) => void;
}) {
  const module = MODULES.find((m) => m.key === moduleKey)!;

  if (moduleKey === 'basicInfo') {
    return (
      <ModuleContainer title={module.title} desc="填写你的基本信息和求职意向">
        <BasicInfoForm initial={library.basicInfo ?? emptyBasicInfo()} onSave={onSetBasicInfo} />
      </ModuleContainer>
    );
  }

  if (moduleKey === 'personalStrengths') {
    return (
      <ModuleContainer title={module.title} desc="维护你的核心优势与亮点" onAdd={() => onAdd(moduleKey)}>
        {(library.personalStrengths?.length ?? 0) === 0 ? (
          <EmptyHint />
        ) : (
          <div className="space-y-2">
            {library.personalStrengths.map((entry) => (
              <CollapsibleEntry
                key={entry.id}
                title={entry.content || '（未填写）'}
                onDelete={() => onDeleteStrength(entry.id)}
              >
                <StrengthForm entry={entry} onSave={(e) => onUpdateStrength(entry.id, e)} onCancel={() => {}} />
              </CollapsibleEntry>
            ))}
          </div>
        )}
      </ModuleContainer>
    );
  }

  if (moduleKey === 'education') {
    return (
      <ModuleContainer title={module.title} desc="维护你的教育背景信息" onAdd={() => onAdd(moduleKey)}>
        {(library.education?.length ?? 0) === 0 ? (
          <EmptyHint />
        ) : (
          <div className="space-y-2">
            {library.education.map((entry) => (
              <CollapsibleEntry
                key={entry.id}
                title={entry.school || '（未填写）'}
                subtitle={[entry.degree, `${entry.startDate} - ${entry.endDate || '至今'}`].filter(Boolean).join(' | ')}
                onDelete={() => onDeleteEdu(entry.id)}
              >
                <EduForm entry={entry} onSave={(e) => onUpdateEdu(entry.id, e)} onCancel={() => {}} />
              </CollapsibleEntry>
            ))}
          </div>
        )}
      </ModuleContainer>
    );
  }

  if (moduleKey === 'workExperience') {
    // Group by company
    const groups = new Map<string, WorkExperienceEntry[]>();
    (library.workExperience ?? []).forEach((entry) => {
      const company = entry.company || '未命名公司';
      if (!groups.has(company)) groups.set(company, []);
      groups.get(company)!.push(entry);
    });
    return (
      <ModuleContainer title={module.title} desc="按公司折叠管理" onAdd={() => onAdd(moduleKey)}>
        {groups.size === 0 ? (
          <EmptyHint />
        ) : (
          <div className="space-y-2">
            {Array.from(groups.entries()).map(([company, entries]) => (
              <CollapsibleEntry
                key={company}
                title={company}
                subtitle={`${entries.length} 段经历`}
              >
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <CollapsibleEntry
                      key={entry.id}
                      title={`${entry.company || '公司'} · ${entry.position || '职位'}`}
                      subtitle={`${entry.startDate || '未填写'} - ${entry.endDate || '至今'}`}
                      onDelete={() => onDeleteWork(entry.id)}
                    >
                      <WorkForm entry={entry} onSave={(e) => onUpdateWork(entry.id, e)} onCancel={() => {}} />
                    </CollapsibleEntry>
                  ))}
                </div>
              </CollapsibleEntry>
            ))}
          </div>
        )}
      </ModuleContainer>
    );
  }

  if (moduleKey === 'projects') {
    return (
      <ModuleContainer title={module.title} desc="维护你的项目经历信息" onAdd={() => onAdd(moduleKey)}>
        {(library.projects?.length ?? 0) === 0 ? (
          <EmptyHint />
        ) : (
          <div className="space-y-2">
            {library.projects.map((entry) => (
              <CollapsibleEntry
                key={entry.id}
                title={entry.name || '（未填写）'}
                subtitle={[entry.role, `${entry.startDate} - ${entry.endDate || '至今'}`].filter(Boolean).join(' | ')}
                onDelete={() => onDeleteProject(entry.id)}
              >
                <ProjectForm entry={entry} onSave={(e) => onUpdateProject(entry.id, e)} onCancel={() => {}} />
              </CollapsibleEntry>
            ))}
          </div>
        )}
      </ModuleContainer>
    );
  }

  return (
    <ModuleContainer title={module.title} desc="维护你的专业技能清单" onAdd={() => onAdd(moduleKey)}>
      {(library.coreSkills?.length ?? 0) === 0 ? (
        <EmptyHint />
      ) : (
        <div className="space-y-2">
          {library.coreSkills.map((entry) => (
            <CollapsibleEntry
              key={entry.id}
              title={entry.category || '（未填写）'}
              subtitle={entry.skills}
              onDelete={() => onDeleteSkill(entry.id)}
            >
              <SkillForm entry={entry} onSave={(e) => onUpdateSkill(entry.id, e)} onCancel={() => {}} />
            </CollapsibleEntry>
          ))}
        </div>
      )}
    </ModuleContainer>
  );
}

// ====== Collapsible Entry ======
function CollapsibleEntry({
  title, subtitle, onDelete, children,
}: {
  title: string; subtitle?: string; onDelete?: () => void; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${open ? 'border-primary-200' : 'border-slate-200'}`}>
      <div className="flex items-center gap-3 px-4 py-3 group">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 flex-1 text-left min-w-0">
          <svg className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{title}</p>
            {subtitle && <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>}
          </div>
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      {open && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-4 animate-fade-in">{children}</div>
      )}
    </div>
  );
}

// ====== Basic Info Form ======
function BasicInfoForm({ initial, onSave }: { initial: BasicInfoEntry; onSave: (info: BasicInfoEntry) => void }) {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="姓名" placeholder="张三" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="手机" placeholder="138****5678" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="邮箱" placeholder="zhangsan@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="所在城市" placeholder="北京 / 上海 / 杭州" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
      </div>
      <Input label="求职意向" placeholder="目标岗位，如：AI产品经理" value={form.jobIntent} onChange={(e) => setForm({ ...form, jobIntent: e.target.value })} />
      <Input label="个人主页 / GitHub" placeholder="https://github.com/..." value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
      <Textarea label="个人简介" rows={4} placeholder="一句话介绍你的职业定位和核心优势" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
      <div className="flex items-center gap-3">
        <Button size="md" onClick={handleSave}>保存基本信息</Button>
        {saved && <span className="text-xs text-emerald-600">已保存</span>}
      </div>
    </div>
  );
}

// ====== Personal Strength ======
function StrengthForm({ entry, onSave, onCancel }: { entry: PersonalStrengthEntry; onSave: (e: PersonalStrengthEntry) => void; onCancel: () => void }) {
  const [form, setForm] = useState(entry);
  return (
    <div className="space-y-3">
      <Textarea label="个人优势" rows={3} placeholder="例如：5年B端产品经验，擅长从0到1搭建产品" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>取消</Button>
        <Button size="sm" onClick={() => onSave(form)}>保存</Button>
      </div>
    </div>
  );
}

function StrengthDisplay({ entry, onEdit }: { entry: PersonalStrengthEntry; onEdit: () => void }) {
  return (
    <div className="cursor-pointer" onClick={onEdit}>
      <p className="text-sm text-slate-700 flex items-start gap-2">
        <span className="mt-0.5 text-primary-400 shrink-0">✦</span>
        <span>{entry.content || <span className="text-slate-300">未填写</span>}</span>
        {entry.status === 'draft' && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">草稿</span>}
      </p>
    </div>
  );
}

function ModuleContainer({ title, desc, onAdd, children }: { title: string; desc: string; onAdd?: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-400">{desc}</span>
        {onAdd && (
          <Button variant="ghost" size="sm" onClick={onAdd} className="ml-auto">
            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            新增
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="text-center py-16 text-slate-400">
      <p className="text-sm">暂无数据</p>
      <p className="text-xs mt-1">请在左侧点击"新增"按钮添加</p>
    </div>
  );
}

// ====== Editable Card ======
function EditableCard({ children, onDelete }: { children: (editing: boolean, setEditing: (v: boolean) => void) => React.ReactNode; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="relative border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors group">
      {!editing && (
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onClick={onDelete} className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      )}
      {children(editing, setEditing)}
    </div>
  );
}

// ====== Date Input ======
function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <MonthPicker value={value} onChange={onChange} placeholder="选择年月" />
    </div>
  );
}

// ====== Education ======
function EduForm({ entry, onSave, onCancel }: { entry: EducationEntry; onSave: (e: EducationEntry) => void; onCancel: () => void }) {
  const [form, setForm] = useState(entry);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input label="学校" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
        <Input label="专业" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input label="学历" placeholder="本科/硕士/博士" value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} />
        <DateInput label="开始时间" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
        <DateInput label="结束时间" value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} />
      </div>
      <Textarea label="描述（选填）" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>取消</Button>
        <Button size="sm" onClick={() => onSave(form)}>保存</Button>
      </div>
    </div>
  );
}

function EduDisplay({ entry, onEdit }: { entry: EducationEntry; onEdit: () => void }) {
  return (
    <div className="cursor-pointer" onClick={onEdit}>
      <p className="text-sm font-medium text-slate-900">{entry.school || <span className="text-slate-300">学校</span>}{entry.major && <span className="font-normal text-slate-500"> · {entry.major}</span>}
        {entry.status === 'draft' && <span className="ml-2 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">草稿</span>}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{entry.degree}{entry.startDate && ` | ${entry.startDate} - ${entry.endDate || '至今'}`}</p>
      {entry.description && <p className="text-xs text-slate-600 mt-1">{entry.description}</p>}
    </div>
  );
}

// ====== Work ======
function WorkForm({ entry, onSave, onCancel }: { entry: WorkExperienceEntry; onSave: (e: WorkExperienceEntry) => void; onCancel: () => void }) {
  const [form, setForm] = useState(entry);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input label="公司名称" placeholder="公司全称" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        <Input label="岗位" placeholder="担任职位" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DateInput label="开始时间" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
        <EndDateInput label="结束时间" value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} />
      </div>
      <Textarea label="工作职责描述" rows={4} placeholder="描述主要职责、项目成果、数据指标等" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>取消</Button>
        <Button size="sm" onClick={() => onSave(form)}>保存</Button>
      </div>
    </div>
  );
}

// ====== End Date Input with "至今" option ======
function EndDateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const isPresent = value === '';
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          {isPresent ? (
            <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">至今</div>
          ) : (
            <MonthPicker value={value} onChange={onChange} placeholder="选择年月" />
          )}
        </div>
        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer shrink-0 select-none">
          <input
            type="checkbox"
            checked={isPresent}
            onChange={(e) => {
              if (e.target.checked) onChange('');
              else {
                const now = new Date();
                onChange(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
              }
            }}
            className="h-3.5 w-3.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500/30"
          />
          至今
        </label>
      </div>
    </div>
  );
}

function WorkDisplay({ entry, onEdit }: { entry: WorkExperienceEntry; onEdit: () => void }) {
  return (
    <div className="cursor-pointer" onClick={onEdit}>
      <div className="flex items-baseline gap-2">
        <p className="text-sm font-medium text-slate-900">{entry.company || <span className="text-slate-300">公司</span>}
          {entry.status === 'draft' && <span className="ml-2 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">草稿</span>}
        </p>
        {entry.position && <span className="text-xs text-slate-500">{entry.position}</span>}
      </div>
      <p className="text-xs text-slate-500 mt-0.5">{entry.startDate} - {entry.endDate || '至今'}</p>
      {entry.description && <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-wrap line-clamp-3">{entry.description}</p>}
    </div>
  );
}

// ====== Project ======
function ProjectForm({ entry, onSave, onCancel }: { entry: ProjectEntry; onSave: (e: ProjectEntry) => void; onCancel: () => void }) {
  const [form, setForm] = useState(entry);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input label="项目名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="担任角色" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DateInput label="开始时间" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
        <DateInput label="结束时间" value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} />
      </div>
      <Textarea label="项目描述" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>取消</Button>
        <Button size="sm" onClick={() => onSave(form)}>保存</Button>
      </div>
    </div>
  );
}

function ProjectDisplay({ entry, onEdit }: { entry: ProjectEntry; onEdit: () => void }) {
  return (
    <div className="cursor-pointer" onClick={onEdit}>
      <div className="flex items-baseline gap-2">
        <p className="text-sm font-medium text-slate-900">{entry.name || <span className="text-slate-300">项目名称</span>}
          {entry.status === 'draft' && <span className="ml-2 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">草稿</span>}
        </p>
        {entry.role && <span className="text-xs text-slate-500">{entry.role}</span>}
      </div>
      <p className="text-xs text-slate-500 mt-0.5">{entry.startDate} - {entry.endDate || '至今'}</p>
      {entry.description && <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-wrap line-clamp-3">{entry.description}</p>}
    </div>
  );
}

// ====== Skill ======
function SkillForm({ entry, onSave, onCancel }: { entry: CoreSkillEntry; onSave: (e: CoreSkillEntry) => void; onCancel: () => void }) {
  const [form, setForm] = useState(entry);
  return (
    <div className="space-y-3">
      <Input label="分类" placeholder="例如：数据分析 / 产品设计" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
      <Textarea label="技能" rows={2} placeholder="用逗号分隔，例如：SQL, Python, Tableau" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>取消</Button>
        <Button size="sm" onClick={() => onSave(form)}>保存</Button>
      </div>
    </div>
  );
}

function SkillDisplay({ entry, onEdit }: { entry: CoreSkillEntry; onEdit: () => void }) {
  return (
    <div className="cursor-pointer" onClick={onEdit}>
      <p className="text-sm font-medium text-slate-900">{entry.category || <span className="text-slate-300">分类</span>}
        {entry.status === 'draft' && <span className="ml-2 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">草稿</span>}
      </p>
      <p className="text-xs text-slate-600 mt-0.5">{entry.skills || <span className="text-slate-300">未填写</span>}</p>
    </div>
  );
}

// ====== SVG Icons ======
function PersonIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>; }
function StarIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.73-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>; }
function EduIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" /></svg>; }
function WorkIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>; }
function ProjectIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>; }
function SkillIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.73-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>; }

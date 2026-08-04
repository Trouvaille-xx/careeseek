import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { track } from '@/services/tracker';
import { SAMPLE_USER_INPUT } from '@/mock/data';

const STAGES = ['在校', '应届', '1-3年', '3-5年', '5-10年', '10年以上'];
const COMPANY_TYPES = ['不限', '互联网大厂', '独角兽', '外企', '创业公司', '国企/央企'];

export function InputPage() {
  const { userInput, setUserInput, startAnalysis, analysisStatus, setUploadedJD, setUploadedResume, uploadedJD, uploadedResume, extractFileContent } = useAppStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!userInput.jdContent.trim()) {
      newErrors.jdContent = 'JD 原文不能为空';
    }
    if (!userInput.resumeContent.trim()) {
      newErrors.resumeContent = '原始简历不能为空';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [userInput.jdContent, userInput.resumeContent]);

  const handleStartAnalysis = useCallback(() => {
    if (validate()) {
      track('input_submit', {});
      track('analysis_step_started', { step: 2 });
      startAnalysis();
    }
  }, [validate, startAnalysis]);

  const loadSampleData = useCallback(() => {
    setUserInput({
      targetRole: SAMPLE_USER_INPUT.targetRole,
      industry: SAMPLE_USER_INPUT.industry,
      companyType: SAMPLE_USER_INPUT.companyType,
      careerStage: SAMPLE_USER_INPUT.careerStage,
      highlightSkills: SAMPLE_USER_INPUT.highlightSkills,
      jdContent: SAMPLE_USER_INPUT.jdContent,
      resumeContent: SAMPLE_USER_INPUT.resumeContent,
      supplementInfo: SAMPLE_USER_INPUT.supplementInfo,
    });
    setErrors({});
  }, [setUserInput]);

  const handleChange = useCallback((field: string, value: string) => {
    setUserInput({ [field]: value });
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [setUserInput, errors]);

  const handleJDFile = useCallback(async (file: File) => {
    const { text, isImage } = await extractFileContent(file);
    if (!isImage) {
      setUserInput({ jdContent: text });
    }
    setUploadedJD({ id: 'jd', name: file.name, type: isImage ? 'image' : file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.docx') ? 'docx' : 'text', content: text, size: file.size, isImage });
  }, [extractFileContent, setUserInput, setUploadedJD]);

  const handleResumeFile = useCallback(async (file: File) => {
    const { text, isImage } = await extractFileContent(file);
    if (!isImage) {
      setUserInput({ resumeContent: text });
    }
    setUploadedResume({ id: 'resume', name: file.name, type: isImage ? 'image' : file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.docx') ? 'docx' : 'text', content: text, size: file.size, isImage });
  }, [extractFileContent, setUserInput, setUploadedResume]);

  return (
    <div className="space-6 animate-fade-in">
      {/* 示例数据提示 */}
      <Card padding="md" className="bg-primary-50/50 dark:bg-neutral-700/50 border-primary-100 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-neutral-700 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-primary-600 dark:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-primary-800 dark:text-primary-200">快速体验</p>
              <p className="text-xs text-primary-600 dark:text-primary-300">点击下方按钮加载示例数据，快速体验完整流程</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadSampleData}>
            使用示例数据
          </Button>
        </div>
      </Card>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column */}
        <div className="flex flex-col gap-6 w-full lg:w-1/2 lg:shrink-0">
          {/* 基本信息 */}
          <Card padding="lg">
            <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100 mb-5 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
              基本信息
            </h3>
            <div className="space-y-4">
              <Input
                label="目标岗位"
                placeholder="例如：AI 产品经理"
                value={userInput.targetRole}
                onChange={(e) => handleChange('targetRole', e.target.value)}
              />
              <Input
                label="目标行业"
                placeholder="例如：人工智能 / SaaS"
                value={userInput.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-neutral-200">公司类型</label>
                <div className="flex flex-wrap gap-2">
                  {COMPANY_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleChange('companyType', t)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all duration-150 ${
                        userInput.companyType === t
                          ? 'border-primary-500 bg-primary-50 dark:bg-neutral-700 text-primary-700 dark:text-primary-300 font-medium'
                          : 'border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:border-slate-300 dark:hover:border-neutral-600 hover:text-slate-700 dark:hover:text-neutral-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-neutral-200">求职阶段</label>
                <div className="flex flex-wrap gap-2">
                  {STAGES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleChange('careerStage', s)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all duration-150 ${
                        userInput.careerStage === s
                          ? 'border-primary-500 bg-primary-50 dark:bg-neutral-700 text-primary-700 dark:text-primary-300 font-medium'
                          : 'border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:border-slate-300 dark:hover:border-neutral-600 hover:text-slate-700 dark:hover:text-neutral-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                label="希望突出能力"
                placeholder="用逗号分隔"
                value={userInput.highlightSkills}
                onChange={(e) => handleChange('highlightSkills', e.target.value)}
              />
            </div>
          </Card>

          {/* 补充信息 */}
          <Card padding="lg">
            <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100 mb-5 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
              补充信息
              <span className="text-xs text-slate-400 dark:text-neutral-500 font-normal">（选填）</span>
            </h3>
            <Textarea
              label="补充信息"
              placeholder="项目细节、技能证书、个人优势等..."
              rows={5}
              value={userInput.supplementInfo}
              onChange={(e) => handleChange('supplementInfo', e.target.value)}
            />
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6 w-full lg:flex-1 lg:min-w-0">
          {/* JD 原文 */}
          <Card padding="lg">
            <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100 mb-5 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
              职位描述（JD）
            </h3>
            <div className="mb-3">
              <FileUpload
                label="JD"
                onFileSelect={handleJDFile}
                onRemove={() => { setUploadedJD(null); setUserInput({ jdContent: '' }); }}
                fileName={uploadedJD?.name}
                isImage={uploadedJD?.isImage}
                accept=".pdf,.md,.txt,.doc,.docx,.json,image/*"
              />
            </div>
            <Textarea
              label="JD 原文"
              placeholder="粘贴目标岗位的职位描述原文..."
              rows={10}
              value={userInput.jdContent}
              onChange={(e) => handleChange('jdContent', e.target.value)}
              error={errors.jdContent}
            />
          </Card>

          {/* 原始简历 */}
          <Card padding="lg">
            <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100 mb-5 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-primary-500 rounded-full" />
              简历内容
            </h3>
            <div className="mb-3">
              <FileUpload
                label="简历"
                onFileSelect={handleResumeFile}
                onRemove={() => { setUploadedResume(null); setUserInput({ resumeContent: '' }); }}
                fileName={uploadedResume?.name}
                isImage={uploadedResume?.isImage}
                accept=".pdf,.md,.txt,.doc,.docx,.json,image/*"
              />
            </div>
            <Textarea
              label="原始简历"
              placeholder="粘贴你的简历原文..."
              rows={14}
              value={userInput.resumeContent}
              onChange={(e) => handleChange('resumeContent', e.target.value)}
              error={errors.resumeContent}
            />
          </Card>
        </div>
      </div>

      {/* 提交按钮 */}
      <div className="flex justify-center mt-8 pb-8">
        <Button
          size="lg"
          onClick={handleStartAnalysis}
          loading={analysisStatus[2] === 'loading'}
          className="min-w-[200px]"
        >
          开始分析
        </Button>
      </div>
    </div>
  );
}

import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  type SkillTemplate,
  getApplyChangeSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getExploreSkillTemplate,
  getFeedbackSkillTemplate,
  getFfChangeSkillTemplate,
  getNewChangeSkillTemplate,
  getOnboardSkillTemplate,
  getOpsxApplyCommandTemplate,
  getOpsxArchiveCommandTemplate,
  getOpsxBulkArchiveCommandTemplate,
  getOpsxContinueCommandTemplate,
  getOpsxExploreCommandTemplate,
  getOpsxFfCommandTemplate,
  getOpsxNewCommandTemplate,
  getOpsxOnboardCommandTemplate,
  getOpsxSyncCommandTemplate,
  getOpsxProposeCommandTemplate,
  getOpsxProposeSkillTemplate,
  getOpsxVerifyCommandTemplate,
  getSyncSpecsSkillTemplate,
  getVerifyChangeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: 'e2765fae6c2e960f4ce07058cfdaa547ff3435d454eacd5e924e38139e97ad52',
  getNewChangeSkillTemplate: 'b0c26f0b65380062e586505c08c72230e59dccea89e6acca7b673f01cba70d5a',
  getContinueChangeSkillTemplate: 'f53b3cf68a43b1597e04f71dfd3e7c3748c4226ea9f4bde05c9fd9ff1a890027',
  getApplyChangeSkillTemplate: '6180a698551da816560f6b43da2fc77622b1ff660a1db4852e900ea763f92b2b',
  getFfChangeSkillTemplate: '50e68fbb49b76d2690b614bffa9e6210e45539fb74419fc2e4311158b6d38485',
  getSyncSpecsSkillTemplate: '9f02b41227db70875b89eefeb275c769142607dc5b2593f4e606794aed2fdbad',
  getOnboardSkillTemplate: '4f4b60fea6e3fc7d2185815b2808fad51535fdd00cd4401b32d1536f32fa2b6d',
  getOpsxExploreCommandTemplate: '4d5e64e3ede6703113cf2fd23b797371ef2407b702478b4f7240fc81cbf2d3a5',
  getOpsxNewCommandTemplate: '757f72e2d9a1a6794b2188704fd39dd2ab65428899b4b361c76cc15a5e4f2ccc',
  getOpsxContinueCommandTemplate: 'fb1ecc3d4334cc48ad0a90b15fb54722bb07d4dc183059a081d71f2e6c82295a',
  getOpsxApplyCommandTemplate: '79fb9ec3dcafcd09c1505f4d54b38af5311ef88bcb4d519f216d84af208dd1e3',
  getOpsxFfCommandTemplate: 'f775b242bcfd56594c431c7f31a0129208a1bacfdb2427074d412543072ef7ca',
  getArchiveChangeSkillTemplate: 'bdf022ae2cdef1feef4d641a068bef3a7fc5d98a323f7ce9f77ac578fe8d20c6',
  getBulkArchiveChangeSkillTemplate: 'fdb1715804e86de85be96222b8efeb9d5b350c6d5c19e343e244655deff8e62b',
  getOpsxSyncCommandTemplate: '4c8118afaea79ff4fed3d946c88e6a7abbba904a5fbf643e4372da1e3735a467',
  getVerifyChangeSkillTemplate: '818639dd20d29dfb0da618c776e1bd7e541718094c5a0ec02cc8c1b37ab9fcde',
  getOpsxArchiveCommandTemplate: '5181ec2f59c9f0f3376e61d952ed4be976cbd01595b6b0d5e67466c8bd6bac6d',
  getOpsxOnboardCommandTemplate: '57c1f3e2590bda8f47818bab1d528456c1b8a9a7501f63ab9e2115e0cfaf6f35',
  getOpsxBulkArchiveCommandTemplate: 'b76c421023ccb5a12867c349f27cdb186234b692c1811980fb94127567bdabda',
  getOpsxVerifyCommandTemplate: '4c3989725d8afd441f0ee455f03c9ba2b77a13e87a50fa70da536678da2135fc',
  getOpsxProposeSkillTemplate: '00ddb7c93b77142d43ed79303d4c09c192b05600e2d6eceda3219020ede167d9',
  getOpsxProposeCommandTemplate: '732ea8faa3f05c70a054cc33219bdce4ab49d1dffef736d632bc5aff1ff14250',
  getFeedbackSkillTemplate: 'd7d83c5f7fc2b92fe8f4588a5bf2d9cb315e4c73ec19bcd5ef28270906319a0d',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': '28d900ef82b325beb65e69ee6435949adcfdf14a4314638e7006e6dc359b92d4',
  'openspec-new-change': 'c99989810f982d72eefc74a35f2282b71f1956f23f61b83aaa58fa3dd921716f',
  'openspec-continue-change': '7cc14c9138b0e88a5202e05434153fd14e2bfcf9f3d13120ea41843e5e246212',
  'openspec-apply-change': '80a5c7af34af9f85ca3ff3309e1716bc49b21aed298e9e03074771ad2a8e435e',
  'openspec-ff-change': '9d9b1995b6f4adb3da570676f7d11fee4cd1cf6c5df8ec83c033e02783a544df',
  'openspec-sync-specs': '2e0f67ec6fadffc6107b4b1a28eef23a99a6649e5fae706897ea1dd9deb852a8',
  'openspec-archive-change': '8d14af2c8b2e4358308ac9fc14f75db42a4b41a07e175825035852a82479793e',
  'openspec-bulk-archive-change': '16207683996b1952559cd4e33463f28fb097761f2c5d912107733d01a90d3f2f',
  'openspec-verify-change': 'e172f0a70154b27379a384e2c919fc7d35bc0e6cdaf392714a3cc4c6633bf074',
  'openspec-onboard': 'b924ea3c97543ebb7ee82c5f194afe7ce87a521c32b85616f445240ab33a02ab',
  'openspec-propose': 'd02cc64569f39a3b555db562f575c1ca351d1ddba8f5513dd09d24bbf7643c4e',
};

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);

    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('skill templates split parity', () => {
  it('preserves all template function payloads exactly', () => {
    const functionFactories: Record<string, () => unknown> = {
      getExploreSkillTemplate,
      getNewChangeSkillTemplate,
      getContinueChangeSkillTemplate,
      getApplyChangeSkillTemplate,
      getFfChangeSkillTemplate,
      getSyncSpecsSkillTemplate,
      getOnboardSkillTemplate,
      getOpsxExploreCommandTemplate,
      getOpsxNewCommandTemplate,
      getOpsxContinueCommandTemplate,
      getOpsxApplyCommandTemplate,
      getOpsxFfCommandTemplate,
      getArchiveChangeSkillTemplate,
      getBulkArchiveChangeSkillTemplate,
      getOpsxSyncCommandTemplate,
      getVerifyChangeSkillTemplate,
      getOpsxArchiveCommandTemplate,
      getOpsxOnboardCommandTemplate,
      getOpsxBulkArchiveCommandTemplate,
      getOpsxVerifyCommandTemplate,
      getOpsxProposeSkillTemplate,
      getOpsxProposeCommandTemplate,
      getFeedbackSkillTemplate,
    };

    const actualHashes = Object.fromEntries(
      Object.entries(functionFactories).map(([name, fn]) => [name, hash(stableStringify(fn()))])
    );

    expect(actualHashes).toEqual(EXPECTED_FUNCTION_HASHES);
  });

  it('preserves generated skill file content exactly', () => {
    // Intentionally excludes getFeedbackSkillTemplate: skillFactories only models templates
    // deployed via generateSkillContent, while feedback is covered in function payload parity.
    const skillFactories: Array<[string, () => SkillTemplate]> = [
      ['openspec-explore', getExploreSkillTemplate],
      ['openspec-new-change', getNewChangeSkillTemplate],
      ['openspec-continue-change', getContinueChangeSkillTemplate],
      ['openspec-apply-change', getApplyChangeSkillTemplate],
      ['openspec-ff-change', getFfChangeSkillTemplate],
      ['openspec-sync-specs', getSyncSpecsSkillTemplate],
      ['openspec-archive-change', getArchiveChangeSkillTemplate],
      ['openspec-bulk-archive-change', getBulkArchiveChangeSkillTemplate],
      ['openspec-verify-change', getVerifyChangeSkillTemplate],
      ['openspec-onboard', getOnboardSkillTemplate],
      ['openspec-propose', getOpsxProposeSkillTemplate],
    ];

    const actualHashes = Object.fromEntries(
      skillFactories.map(([dirName, createTemplate]) => [
        dirName,
        hash(generateSkillContent(createTemplate(), 'PARITY-BASELINE')),
      ])
    );

    expect(actualHashes).toEqual(EXPECTED_GENERATED_SKILL_CONTENT_HASHES);
  });

  it('guards unsupported workspace workflows from repo-local fallback edits', () => {
    const guardedSkills: Array<[string, () => SkillTemplate, string]> = [
      ['openspec-apply-change', getApplyChangeSkillTemplate, 'full workspace apply is not supported'],
      ['openspec-sync-specs', getSyncSpecsSkillTemplate, 'workspace spec sync is not supported'],
      ['openspec-archive-change', getArchiveChangeSkillTemplate, 'workspace archive is not supported'],
      ['openspec-bulk-archive-change', getBulkArchiveChangeSkillTemplate, 'workspace bulk archive is not supported'],
      ['openspec-verify-change', getVerifyChangeSkillTemplate, 'full workspace implementation verification is not supported'],
    ];

    for (const [dirName, createTemplate, guardText] of guardedSkills) {
      const content = generateSkillContent(createTemplate(), 'PARITY-BASELINE');

      expect(content, dirName).toContain('actionContext.mode: "workspace-planning"');
      expect(content, dirName).toContain(guardText);
      expect(content, dirName).not.toContain('openspec/changes/<name>');
      expect(content, dirName).not.toContain('mv openspec/changes');
    }
  });

  it('requires propose and continue workflows to create or update Lean architecture model', () => {
    const templates = [
      getOpsxProposeSkillTemplate().instructions,
      getOpsxProposeCommandTemplate().content,
      getContinueChangeSkillTemplate().instructions,
      getOpsxContinueCommandTemplate().content,
    ];

    for (const content of templates) {
      expect(content).toContain('openspec/formal');
      expect(content).toContain('Lean model');
      expect(content).toContain('openspec validate "<name>" --json');
    }
  });
});

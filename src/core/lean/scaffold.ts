import path from 'node:path';
import { FileSystemUtils } from '../../utils/file-system.js';

const LEAN_FORMAL_FILES: Array<{ path: string; content: string }> = [
  {
    path: 'lean-toolchain',
    content: 'leanprover/lean4:stable\n',
  },
  {
    path: 'lakefile.lean',
    content: [
      'import Lake',
      'open Lake DSL',
      '',
      'package «OpenSpecFormal» where',
      '',
      'lean_lib «OpenSpecFormal» where',
      '',
    ].join('\n'),
  },
  {
    path: 'OpenSpecFormal.lean',
    content: 'import OpenSpecFormal.Architecture\n',
  },
  {
    path: path.join('OpenSpecFormal', 'Architecture.lean'),
    content: [
      'namespace OpenSpecFormal',
      '',
      'inductive ArtifactKind where',
      '  | proseSpec',
      '  | design',
      '  | taskPlan',
      '  | leanModel',
      '  | implementation',
      'deriving Repr, DecidableEq',
      '',
      'structure ArchitecturalIntent where',
      '  name : String',
      '  rationale : String',
      'deriving Repr, DecidableEq',
      '',
      'def requiresLeanUpdate (semanticsChanged : Bool) : Bool :=',
      '  semanticsChanged',
      '',
      'theorem semantic_change_requires_lean_update :',
      '    requiresLeanUpdate true = true := rfl',
      '',
      'end OpenSpecFormal',
      '',
    ].join('\n'),
  },
];

export async function createLeanFormalScaffold(openspecPath: string): Promise<void> {
  const formalPath = path.join(openspecPath, 'formal');
  await FileSystemUtils.createDirectory(formalPath);

  for (const file of LEAN_FORMAL_FILES) {
    const targetPath = path.join(formalPath, file.path);
    if (!(await FileSystemUtils.fileExists(targetPath))) {
      await FileSystemUtils.writeFile(targetPath, file.content);
    }
  }
}

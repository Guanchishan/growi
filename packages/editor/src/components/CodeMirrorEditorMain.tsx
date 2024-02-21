import { useEffect } from 'react';

import { type Extension } from '@codemirror/state';
import { keymap, scrollPastEnd } from '@codemirror/view';

import { GlobalCodeMirrorEditorKey } from '../consts';
import { setDataLine } from '../services/extensions/setDataLine';
import { useCodeMirrorEditorIsolated, useCollaborativeEditorMode } from '../stores';

import { CodeMirrorEditor, CodeMirrorEditorProps } from '.';

const additionalExtensions: Extension[] = [
  [
    scrollPastEnd(),
    setDataLine,
  ],
];

type Props = CodeMirrorEditorProps & {
  userName?: string,
  pageId?: string,
  initialValue?: string,
  onOpenEditor?: (markdown: string) => void,
}

export const CodeMirrorEditorMain = (props: Props): JSX.Element => {
  const {
    acceptedUploadFileType,
    indentSize, userName, pageId, initialValue,
    editorTheme, editorKeymap,
    onSave, onChange, onUpload, onScroll, onOpenEditor,
  } = props;

  const { data: codeMirrorEditor } = useCodeMirrorEditorIsolated(GlobalCodeMirrorEditorKey.MAIN);

  useCollaborativeEditorMode(userName, pageId, initialValue, onOpenEditor, codeMirrorEditor);

  // setup additional extensions
  useEffect(() => {
    return codeMirrorEditor?.appendExtensions?.(additionalExtensions);
  }, [codeMirrorEditor]);

  // set handler to save with shortcut key
  useEffect(() => {
    if (onSave == null) {
      return;
    }

    const extension = keymap.of([
      {
        key: 'Mod-s',
        preventDefault: true,
        run: () => {
          const doc = codeMirrorEditor?.getDoc();
          if (doc != null) {
            onSave();
          }
          return true;
        },
      },
    ]);

    const cleanupFunction = codeMirrorEditor?.appendExtensions?.(extension);

    return cleanupFunction;
  }, [codeMirrorEditor, onSave]);


  return (
    <CodeMirrorEditor
      editorKey={GlobalCodeMirrorEditorKey.MAIN}
      onChange={onChange}
      onSave={onSave}
      onUpload={onUpload}
      onScroll={onScroll}
      acceptedUploadFileType={acceptedUploadFileType}
      indentSize={indentSize}
      editorTheme={editorTheme}
      editorKeymap={editorKeymap}
    />
  );
};

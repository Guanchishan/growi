import React, {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
} from 'react';

import type EventEmitter from 'events';
import nodePath from 'path';

import type { IPageHasId } from '@growi/core';
import { useGlobalSocket } from '@growi/core/dist/swr';
import { pathUtils } from '@growi/core/dist/utils';
import {
  CodeMirrorEditorMain, GlobalCodeMirrorEditorKey, AcceptedUploadFileType,
  useCodeMirrorEditorIsolated, useResolvedThemeForEditor,
} from '@growi/editor';
import detectIndent from 'detect-indent';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { throttle, debounce } from 'throttle-debounce';


import { useShouldExpandContent } from '~/client/services/layout';
import { useUpdateStateAfterSave, updatePage } from '~/client/services/page-operation';
import { apiv3Get, apiv3PostForm } from '~/client/util/apiv3-client';
import { toastError, toastSuccess } from '~/client/util/toastr';
import { SocketEventName } from '~/interfaces/websocket';
import {
  useDefaultIndentSize, useCurrentUser,
  useCurrentPathname, useIsEnabledAttachTitleHeader,
  useIsEditable, useIsUploadAllFileAllowed, useIsUploadEnabled, useIsIndentSizeForced,
} from '~/stores/context';
import {
  useEditorSettings,
  useCurrentIndentSize, useIsSlackEnabled, usePageTagsForEditors,
  useIsConflict,
  useEditingMarkdown,
  useWaitingSaveProcessing,
} from '~/stores/editor';
import { useConflictDiffModal } from '~/stores/modal';
import {
  useCurrentPagePath, useSWRMUTxCurrentPage, useSWRxCurrentPage, useSWRxTagsInfo, useCurrentPageId, useIsNotFound, useIsLatestRevision, useTemplateBodyData,
} from '~/stores/page';
import { mutatePageTree } from '~/stores/page-listing';
import {
  useRemoteRevisionId,
  useRemoteRevisionBody,
  useRemoteRevisionLastUpdatedAt,
  useRemoteRevisionLastUpdateUser,
} from '~/stores/remote-latest-page';
import { usePreviewOptions } from '~/stores/renderer';
import {
  EditorMode,
  useEditorMode, useSelectedGrant,
} from '~/stores/ui';
import { useNextThemes } from '~/stores/use-next-themes';
import loggerFactory from '~/utils/logger';

import { PageHeader } from '../PageHeader/PageHeader';

// import { ConflictDiffModal } from './PageEditor/ConflictDiffModal';
// import { ConflictDiffModal } from './ConflictDiffModal';
// import Editor from './Editor';
import EditorNavbarBottom from './EditorNavbarBottom';
import Preview from './Preview';
import { scrollEditor, scrollPreview } from './ScrollSyncHelper';

import '@growi/editor/dist/style.css';


const logger = loggerFactory('growi:PageEditor');


declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var globalEmitter: EventEmitter;
}

// for scrolling
let isOriginOfScrollSyncEditor = false;
let isOriginOfScrollSyncPreview = false;

type Props = {
  visibility?: boolean,
}

export const PageEditor = React.memo((props: Props): JSX.Element => {

  const { t } = useTranslation();
  const router = useRouter();

  const previewRef = useRef<HTMLDivElement>(null);

  const { data: isNotFound } = useIsNotFound();
  const { data: pageId } = useCurrentPageId();
  const { data: currentPagePath } = useCurrentPagePath();
  const { data: currentPathname } = useCurrentPathname();
  const { data: currentPage } = useSWRxCurrentPage();
  const { trigger: mutateCurrentPage } = useSWRMUTxCurrentPage();
  const { data: grantData } = useSelectedGrant();
  const { sync: syncTagsInfoForEditor } = usePageTagsForEditors(pageId);
  const { mutate: mutateTagsInfo } = useSWRxTagsInfo(pageId);
  const { data: editingMarkdown, mutate: mutateEditingMarkdown } = useEditingMarkdown();
  const { data: isEnabledAttachTitleHeader } = useIsEnabledAttachTitleHeader();
  const { data: templateBodyData } = useTemplateBodyData();
  const { data: isEditable } = useIsEditable();
  const { mutate: mutateWaitingSaveProcessing } = useWaitingSaveProcessing();
  const { data: editorMode, mutate: mutateEditorMode } = useEditorMode();
  const { data: isSlackEnabled } = useIsSlackEnabled();
  const { data: isIndentSizeForced } = useIsIndentSizeForced();
  const { data: currentIndentSize, mutate: mutateCurrentIndentSize } = useCurrentIndentSize();
  const { data: defaultIndentSize } = useDefaultIndentSize();
  const { data: isUploadAllFileAllowed } = useIsUploadAllFileAllowed();
  const { data: isUploadEnabled } = useIsUploadEnabled();
  const { data: conflictDiffModalStatus, close: closeConflictDiffModal } = useConflictDiffModal();
  const { data: editorSettings } = useEditorSettings();
  const { mutate: mutateIsLatestRevision } = useIsLatestRevision();
  const { mutate: mutateRemotePageId } = useRemoteRevisionId();
  const { mutate: mutateRemoteRevisionId } = useRemoteRevisionBody();
  const { mutate: mutateRemoteRevisionLastUpdatedAt } = useRemoteRevisionLastUpdatedAt();
  const { mutate: mutateRemoteRevisionLastUpdateUser } = useRemoteRevisionLastUpdateUser();
  const { data: user } = useCurrentUser();

  const { data: socket } = useGlobalSocket();

  const { data: rendererOptions } = usePreviewOptions();
  const { mutate: mutateIsConflict } = useIsConflict();

  const { mutate: mutateResolvedTheme } = useResolvedThemeForEditor();

  const shouldExpandContent = useShouldExpandContent(currentPage);

  const updateStateAfterSave = useUpdateStateAfterSave(pageId, { supressEditingMarkdownMutation: true });

  const { resolvedTheme } = useNextThemes();
  mutateResolvedTheme({ themeData: resolvedTheme });

  // TODO: remove workaround
  // for https://redmine.weseek.co.jp/issues/125923
  const [createdPageRevisionIdWithAttachment, setCreatedPageRevisionIdWithAttachment] = useState();

  // TODO: remove workaround
  // for https://redmine.weseek.co.jp/issues/125923
  const currentRevisionId = currentPage?.revision?._id ?? createdPageRevisionIdWithAttachment;

  const initialValueRef = useRef('');
  const initialValue = useMemo(() => {
    if (!isNotFound) {
      return editingMarkdown ?? '';
    }

    let initialValue = '';
    if (isEnabledAttachTitleHeader && currentPathname != null) {
      const pageTitle = nodePath.basename(currentPathname);
      initialValue += `${pathUtils.attachTitleHeader(pageTitle)}\n`;
    }
    if (templateBodyData != null) {
      initialValue += `${templateBodyData}\n`;
    }

    return initialValue;

  }, [isNotFound, currentPathname, editingMarkdown, isEnabledAttachTitleHeader, templateBodyData]);

  useEffect(() => {
    // set to ref
    initialValueRef.current = initialValue;
  }, [initialValue]);


  const [markdownToPreview, setMarkdownToPreview] = useState<string>(initialValue);
  const setMarkdownPreviewWithDebounce = useMemo(() => debounce(100, throttle(150, (value: string) => {
    setMarkdownToPreview(value);
  })), []);
  // const mutateIsEnabledUnsavedWarningWithDebounce = useMemo(() => debounce(600, throttle(900, (value: string) => {
  //   // Displays an unsaved warning alert
  //   mutateIsEnabledUnsavedWarning(value !== initialValueRef.current);
  // })), [mutateIsEnabledUnsavedWarning]);

  const markdownChangedHandler = useCallback((value: string) => {
    setMarkdownPreviewWithDebounce(value);
    // mutateIsEnabledUnsavedWarningWithDebounce(value);
  // }, [mutateIsEnabledUnsavedWarningWithDebounce, setMarkdownPreviewWithDebounce]);
  }, [setMarkdownPreviewWithDebounce]);


  const { data: codeMirrorEditor } = useCodeMirrorEditorIsolated(GlobalCodeMirrorEditorKey.MAIN);


  const checkIsConflict = useCallback((data) => {
    const { s2cMessagePageUpdated } = data;

    const isConflict = markdownToPreview !== s2cMessagePageUpdated.revisionBody;

    mutateIsConflict(isConflict);

  }, [markdownToPreview, mutateIsConflict]);

  // TODO: remove workaround
  // for https://redmine.weseek.co.jp/issues/125923
  useEffect(() => {
    setCreatedPageRevisionIdWithAttachment(undefined);
  }, [router]);

  useEffect(() => {
    if (socket == null) { return }

    socket.on(SocketEventName.PageUpdated, checkIsConflict);

    return () => {
      socket.off(SocketEventName.PageUpdated, checkIsConflict);
    };

  }, [socket, checkIsConflict]);

  const save = useCallback(async(opts?: {slackChannels: string, overwriteScopesOfDescendants?: boolean}): Promise<IPageHasId | null> => {
    if (pageId == null || currentPagePath == null || currentRevisionId == null || grantData == null) {
      logger.error('Some materials to save are invalid', {
        pageId, currentPagePath, currentRevisionId, grantData,
      });
      throw new Error('Some materials to save are invalid');
    }

    try {
      mutateWaitingSaveProcessing(true);

      const { page } = await updatePage({
        pageId,
        revisionId: currentRevisionId,
        body: codeMirrorEditor?.getDoc() ?? '',
        grant: grantData?.grant,
        userRelatedGrantUserGroupIds: grantData?.userRelatedGrantedGroups?.map((group) => {
          return { item: group.id, type: group.type };
        }),
        ...(opts ?? {}),
      });

      // to sync revision id with page tree: https://github.com/weseek/growi/pull/7227
      mutatePageTree();

      return page;
    }
    catch (error) {
      logger.error('failed to save', error);
      toastError(error);
      if (error.code === 'conflict') {
        mutateRemotePageId(error.data.revisionId);
        mutateRemoteRevisionId(error.data.revisionBody);
        mutateRemoteRevisionLastUpdatedAt(error.data.createdAt);
        mutateRemoteRevisionLastUpdateUser(error.data.user);
      }
      return null;
    }
    finally {
      mutateWaitingSaveProcessing(false);
    }

  // eslint-disable-next-line max-len
  }, [codeMirrorEditor, grantData, pageId, currentPagePath, currentRevisionId, mutateWaitingSaveProcessing, mutateRemotePageId, mutateRemoteRevisionId, mutateRemoteRevisionLastUpdatedAt, mutateRemoteRevisionLastUpdateUser]);

  const saveAndReturnToViewHandler = useCallback(async(opts: {slackChannels: string, overwriteScopesOfDescendants?: boolean}) => {
    const page = await save(opts);
    if (page == null) {
      return;
    }

    mutateEditorMode(EditorMode.View);
    updateStateAfterSave?.();
  }, [mutateEditorMode, save, updateStateAfterSave]);

  const saveWithShortcut = useCallback(async() => {
    const page = await save();
    if (page == null) {
      return;
    }

    toastSuccess(t('toaster.save_succeeded'));
    updateStateAfterSave?.();
  }, [save, t, updateStateAfterSave]);


  // the upload event handler
  const uploadHandler = useCallback((files: File[]) => {
    files.forEach(async(file) => {
      try {
        const { data: resLimit } = await apiv3Get('/attachment/limit', { fileSize: file.size });

        if (!resLimit.isUploadable) {
          throw new Error(resLimit.errorMessage);
        }

        const formData = new FormData();
        formData.append('file', file);
        if (pageId != null) {
          formData.append('page_id', pageId);
        }

        const { data: resAdd } = await apiv3PostForm('/attachment', formData);

        const attachment = resAdd.attachment;
        const fileName = attachment.originalName;

        let insertText = `[${fileName}](${attachment.filePathProxied})\n`;
        // when image
        if (attachment.fileFormat.startsWith('image/')) {
          // modify to "![fileName](url)" syntax
          insertText = `!${insertText}`;
        }

        codeMirrorEditor?.insertText(insertText);
      }
      catch (e) {
        logger.error('failed to upload', e);
        toastError(e);
      }
    });

  }, [codeMirrorEditor, pageId]);

  const acceptedFileType = useMemo(() => {
    if (!isUploadEnabled) {
      return AcceptedUploadFileType.NONE;
    }
    if (isUploadAllFileAllowed) {
      return AcceptedUploadFileType.ALL;
    }
    return AcceptedUploadFileType.IMAGE;
  }, [isUploadAllFileAllowed, isUploadEnabled]);


  const scrollEditorHandler = useCallback(() => {
    if (codeMirrorEditor?.view?.scrollDOM == null || previewRef.current == null) {
      return;
    }

    if (isOriginOfScrollSyncPreview) {
      isOriginOfScrollSyncPreview = false;
      return;
    }

    isOriginOfScrollSyncEditor = true;
    scrollEditor(codeMirrorEditor.view.scrollDOM, previewRef.current);
  }, [codeMirrorEditor, previewRef]);

  const scrollEditorHandlerThrottle = useMemo(() => throttle(25, scrollEditorHandler), [scrollEditorHandler]);

  const scrollPreviewHandler = useCallback(() => {
    if (codeMirrorEditor?.view?.scrollDOM == null || previewRef.current == null) {
      return;
    }

    if (isOriginOfScrollSyncEditor) {
      isOriginOfScrollSyncEditor = false;
      return;
    }

    isOriginOfScrollSyncPreview = true;
    scrollPreview(codeMirrorEditor.view.scrollDOM, previewRef.current);
  }, [codeMirrorEditor, previewRef]);

  const scrollPreviewHandlerThrottle = useMemo(() => throttle(25, scrollPreviewHandler), [scrollPreviewHandler]);

  const afterResolvedHandler = useCallback(async() => {
    // get page data from db
    const pageData = await mutateCurrentPage();

    // update tag
    await mutateTagsInfo(); // get from DB
    syncTagsInfoForEditor(); // sync global state for client

    // clear isConflict
    mutateIsConflict(false);

    // set resolved markdown in editing markdown
    const markdown = pageData?.revision.body ?? '';
    mutateEditingMarkdown(markdown);

  }, [mutateCurrentPage, mutateEditingMarkdown, mutateIsConflict, mutateTagsInfo, syncTagsInfoForEditor]);

  // initial caret line
  useEffect(() => {
    codeMirrorEditor?.setCaretLine();
  }, [codeMirrorEditor]);

  // set handler to save and return to View
  useEffect(() => {
    globalEmitter.on('saveAndReturnToView', saveAndReturnToViewHandler);

    return function cleanup() {
      globalEmitter.removeListener('saveAndReturnToView', saveAndReturnToViewHandler);
    };
  }, [saveAndReturnToViewHandler]);

  // set handler to focus
  useLayoutEffect(() => {
    if (editorMode === EditorMode.Editor) {
      codeMirrorEditor?.focus();
    }
  }, [codeMirrorEditor, editorMode]);

  // Detect indent size from contents (only when users are allowed to change it)
  useEffect(() => {
    // do nothing if the indent size fixed
    if (isIndentSizeForced == null || isIndentSizeForced) {
      mutateCurrentIndentSize(undefined);
      return;
    }

    // detect from markdown
    if (initialValue != null) {
      const detectedIndent = detectIndent(initialValue);
      if (detectedIndent.type === 'space' && new Set([2, 4]).has(detectedIndent.amount)) {
        mutateCurrentIndentSize(detectedIndent.amount);
      }
    }
  }, [initialValue, isIndentSizeForced, mutateCurrentIndentSize]);


  // TODO: Check the reproduction conditions that made this code necessary and confirm reproduction
  // // when transitioning to a different page, if the initialValue is the same,
  // // UnControlled CodeMirror value does not reset, so explicitly set the value to initialValue
  // const onRouterChangeComplete = useCallback(() => {
  //   codeMirrorEditor?.initDoc(ydoc?.getText('codemirror').toString());
  //   codeMirrorEditor?.setCaretLine();
  // }, [codeMirrorEditor, ydoc]);

  // useEffect(() => {
  //   router.events.on('routeChangeComplete', onRouterChangeComplete);
  //   return () => {
  //     router.events.off('routeChangeComplete', onRouterChangeComplete);
  //   };
  // }, [onRouterChangeComplete, router.events]);

  if (!isEditable) {
    return <></>;
  }

  if (rendererOptions == null) {
    return <></>;
  }

  return (
    <div data-testid="page-editor" id="page-editor" className={`flex-expand-vert ${props.visibility ? '' : 'd-none'}`}>
      <div className="ms-3 mt-2">
        <PageHeader />
      </div>
      <div className={`flex-expand-horiz ${props.visibility ? '' : 'd-none'}`}>
        <div className="page-editor-editor-container flex-expand-vert">
          {/* <Editor
            ref={editorRef}
            value={initialValue}
            isUploadable={isUploadable}
            isUploadAllFileAllowed={isUploadAllFileAllowed}
            indentSize={currentIndentSize}
            onScroll={editorScrolledHandler}
            onScrollCursorIntoView={editorScrollCursorIntoViewHandler}
            onChange={markdownChangedHandler}
            onUpload={uploadHandler}
            onSave={saveWithShortcut}
          /> */}
          <CodeMirrorEditorMain
            onChange={markdownChangedHandler}
            onSave={saveWithShortcut}
            onUpload={uploadHandler}
            acceptedFileType={acceptedFileType}
            onScroll={scrollEditorHandlerThrottle}
            indentSize={currentIndentSize ?? defaultIndentSize}
            userName={user?.name}
            pageId={pageId ?? undefined}
            initialValue={initialValue}
            onOpenEditor={markdown => setMarkdownToPreview(markdown)}
            editorTheme={editorSettings?.theme}
            editorKeymap={editorSettings?.keymapMode}
          />
        </div>
        <div ref={previewRef} onScroll={scrollPreviewHandlerThrottle} className="page-editor-preview-container flex-expand-vert d-none d-lg-flex">
          <Preview
            rendererOptions={rendererOptions}
            markdown={markdownToPreview}
            pagePath={currentPagePath}
            expandContentWidth={shouldExpandContent}
            // TODO: Dynamic changes by height or resizing the last element
            pastEnd={500}
          />
        </div>
        {/*
        <ConflictDiffModal
          isOpen={conflictDiffModalStatus?.isOpened}
          onClose={() => closeConflictDiffModal()}
          markdownOnEdit={markdownToPreview}
          optionsToSave={optionsToSave}
          afterResolvedHandler={afterResolvedHandler}
        />
        */}
      </div>
      <EditorNavbarBottom />
    </div>
  );
});
PageEditor.displayName = 'PageEditor';

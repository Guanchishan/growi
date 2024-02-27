import React, { useCallback, useMemo } from 'react';

import { useTranslation } from 'next-i18next';
import * as ReactDOMServer from 'react-dom/server';

import { useIsGuestUser, useIsReadOnlyUser } from '~/stores/context';
import { useEditingMarkdown, useIsConflict } from '~/stores/editor';
import { useConflictDiffModal } from '~/stores/modal';
import { useSWRMUTxCurrentPage, useSWRxCurrentPage } from '~/stores/page';
import { useRemoteRevisionId, useRemoteRevisionLastUpdateUser } from '~/stores/remote-latest-page';

import { Username } from './User/Username';

import styles from './PageStatusAlert.module.scss';

type AlertComponentContents = {
  additionalClasses: string[],
  label: JSX.Element,
  btn: JSX.Element
}

export const PageStatusAlert = (): JSX.Element => {

  const { t } = useTranslation();
  const { data: isConflict } = useIsConflict();
  const { mutate: mutateEditingMarkdown } = useEditingMarkdown();
  const { open: openConflictDiffModal } = useConflictDiffModal();
  const { data: isGuestUser } = useIsGuestUser();
  const { data: isReadOnlyUser } = useIsReadOnlyUser();

  // store remote latest page data
  const { data: remoteRevisionId } = useRemoteRevisionId();
  const { data: remoteRevisionLastUpdateUser } = useRemoteRevisionLastUpdateUser();

  const { data: pageData } = useSWRxCurrentPage();
  const { trigger: mutatePageData } = useSWRMUTxCurrentPage();
  const revision = pageData?.revision;

  const refreshPage = useCallback(async() => {
    const updatedPageData = await mutatePageData();
    mutateEditingMarkdown(updatedPageData?.revision?.body);
  }, [mutateEditingMarkdown, mutatePageData]);

  const onClickResolveConflict = useCallback(() => {
    openConflictDiffModal();
  }, [openConflictDiffModal]);

  // TODO: re-impl for builtin editor
  //
  // const getContentsForSomeoneEditingAlert = useCallback((): AlertComponentContents => {
  //   return {
  //     additionalClasses: ['bg-success', 'd-hackmd-none'],
  //     label:
  // <>
  //   <span className="material-symbols-outlined">person</span>
  //   {t('hackmd.someone_editing')}
  // </>,
  //     btn:
  // <a href="#hackmd" key="btnOpenHackmdSomeoneEditing" className="btn btn-outline-white">
  //   <span class="material-symbols-outlined">description</span>
  //   Open HackMD Editor
  // </a>,
  //   };
  // }, [t]);

  const getContentsForUpdatedAlert = useCallback((): AlertComponentContents => {

    const usernameComponentToString = ReactDOMServer.renderToString(<Username user={remoteRevisionLastUpdateUser} />);

    const label1 = isConflict
      ? t('modal_resolve_conflict.file_conflicting_with_newer_remote')
      // eslint-disable-next-line react/no-danger
      : <span dangerouslySetInnerHTML={{ __html: `${usernameComponentToString} ${t('edited this page')}` }} />;

    return {
      additionalClasses: ['bg-warning text-dark'],
      label:
  <>
    <span className="material-symbols-outlined">lightbulb</span>
    {label1}
  </>,
      btn:
  <>
    <button type="button" onClick={() => refreshPage()} className="btn btn-outline-white me-4">
      <span className="material-symbols-outlined">refresh</span>
      {t('Load latest')}
    </button>
    { isConflict && (
      <button
        type="button"
        onClick={onClickResolveConflict}
        className="btn btn-outline-white"
      >
        <span className="material-symbols-outlined">description</span>
        {t('modal_resolve_conflict.resolve_conflict')}
      </button>
    )}
  </>,
    };
  }, [remoteRevisionLastUpdateUser, isConflict, t, onClickResolveConflict, refreshPage]);

  const alertComponentContents = useMemo(() => {
    const isRevisionOutdated = revision?._id !== remoteRevisionId;

    // 'revision?._id' and 'remoteRevisionId' are can not be undefined
    if (revision?._id == null || remoteRevisionId == null) { return }

    // when remote revision is newer than both
    if (isRevisionOutdated) {
      return getContentsForUpdatedAlert();
    }

    return null;
  }, [revision?._id, remoteRevisionId, getContentsForUpdatedAlert]);

  if (!!isGuestUser || !!isReadOnlyUser || alertComponentContents == null) { return <></> }

  const { additionalClasses, label, btn } = alertComponentContents;

  return (
    <div className={`${styles['grw-page-status-alert']} card text-white fixed-bottom animated fadeInUp faster ${additionalClasses.join(' ')}`}>
      <div className="card-body">
        <p className="card-text grw-card-label-container">
          {label}
        </p>
        <p className="card-text grw-card-btn-container">
          {btn}
        </p>
      </div>
    </div>
  );

};

import { useCallback } from 'react';

import type { IPagePopulatedToShowRevision } from '@growi/core';
import { useTranslation } from 'next-i18next';

import { apiv3Put } from '~/client/util/apiv3-client';
import { toastSuccess, toastError } from '~/client/util/toastr';
import { useSWRMUTxCurrentPage } from '~/stores/page';
import { mutatePageTree, mutatePageList } from '~/stores/page-listing';

export const usePagePathRenameHandler = (
    currentPage: IPagePopulatedToShowRevision, onRenameFinish?: () => void, onRenameFailure?: () => void,
): (newPagePath: string) => Promise<void> => {

  const { trigger: mutateCurrentPage } = useSWRMUTxCurrentPage();
  const { t } = useTranslation();

  const currentPagePath = currentPage.path;

  const pagePathRenameHandler = useCallback(async(newPagePath: string) => {

    const onRenamed = (fromPath: string | undefined, toPath: string) => {
      mutatePageTree();
      mutatePageList();

      if (currentPagePath === fromPath || currentPagePath === toPath) {
        mutateCurrentPage();
      }
    };

    if (newPagePath === currentPage.path || newPagePath === '') {
      onRenameFinish?.();
      return;
    }

    try {
      onRenameFinish?.();
      await apiv3Put('/pages/rename', {
        pageId: currentPage._id,
        revisionId: currentPage.revision._id,
        newPagePath,
      });

      onRenamed(currentPage.path, newPagePath);

      toastSuccess(t('renamed_pages', { path: currentPage.path }));
    }
    catch (err) {
      onRenameFailure?.();
      toastError(err);
    }
  }, [currentPage._id, currentPage.path, currentPage.revision._id, currentPagePath, mutateCurrentPage, onRenameFailure, onRenameFinish, t]);

  return pagePathRenameHandler;
};

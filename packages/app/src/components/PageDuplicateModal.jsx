import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import {
  Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap';

import { withTranslation } from 'react-i18next';
import { debounce } from 'throttle-debounce';
import { withUnstatedContainers } from './UnstatedUtils';
import { toastError } from '~/client/util/apiNotification';
import { usePageDuplicateModal } from '~/stores/modal';

import AppContainer from '~/client/services/AppContainer';
import PagePathAutoComplete from './PagePathAutoComplete';
import ApiErrorMessageList from './PageManagement/ApiErrorMessageList';
import ComparePathsTable from './ComparePathsTable';
import DuplicatePathsTable from './DuplicatedPathsTable';

const LIMIT_FOR_LIST = 10;

const PageDuplicateModal = (props) => {
  const {
    t, appContainer,
  } = props;

  const config = appContainer.getConfig();
  const isReachable = config.isSearchServiceReachable;
  const { crowi } = appContainer.config;
  const { data: duplicateModalData, close: closeDuplicateModal } = usePageDuplicateModal();

  const { isOpened, page } = duplicateModalData;
  const { pageId, path } = page;

  const [pageNameInput, setPageNameInput] = useState(path);

  const [errs, setErrs] = useState(null);

  const [subordinatedPages, setSubordinatedPages] = useState([]);
  const [isDuplicateRecursively, setIsDuplicateRecursively] = useState(true);
  const [isDuplicateRecursivelyWithoutExistPath, setIsDuplicateRecursivelyWithoutExistPath] = useState(true);
  const [existingPaths, setExistingPaths] = useState([]);

  const checkExistPaths = useCallback(async(newParentPath) => {
    try {
      const res = await appContainer.apiv3Get('/page/exist-paths', { fromPath: path, toPath: newParentPath });
      const { existPaths } = res.data;
      setExistingPaths(existPaths);
    }
    catch (err) {
      setErrs(err);
      toastError(t('modal_rename.label.Fail to get exist path'));
    }
  }, [appContainer, path, t]);


  const checkExistPathsDebounce = useCallback(() => {
    debounce(1000, checkExistPaths);
  }, [checkExistPaths]);

  useEffect(() => {
    if (path == null) {
      return;
    }
    if (pageId != null && path != null && pageNameInput !== path) {
      checkExistPathsDebounce(pageNameInput, subordinatedPages);
    }
  }, [pageNameInput, subordinatedPages, path, pageId, checkExistPathsDebounce]);

  /**
   * change pageNameInput for PagePathAutoComplete
   * @param {string} value
   */
  function ppacInputChangeHandler(value) {
    setErrs(null);
    setPageNameInput(value);
  }

  /**
   * change pageNameInput
   * @param {string} value
   */
  function inputChangeHandler(value) {
    setErrs(null);
    setPageNameInput(value ?? '');
  }

  function changeIsDuplicateRecursivelyHandler() {
    setIsDuplicateRecursively(!isDuplicateRecursively);
  }

  const getSubordinatedList = useCallback(async() => {
    try {
      const res = await appContainer.apiv3Get('/pages/subordinated-list', { path, limit: LIMIT_FOR_LIST });
      const { subordinatedPaths } = res.data;
      setSubordinatedPages(subordinatedPaths);
    }
    catch (err) {
      setErrs(err);
      toastError(t('modal_duplicate.label.Fail to get subordinated pages'));
    }
  }, [appContainer, path, t]);

  useEffect(() => {
    if (isOpened) {
      getSubordinatedList();
      setPageNameInput(path);
    }
  }, [isOpened, getSubordinatedList, path]);

  function changeIsDuplicateRecursivelyWithoutExistPathHandler() {
    setIsDuplicateRecursivelyWithoutExistPath(!isDuplicateRecursivelyWithoutExistPath);
  }

  async function duplicate() {
    setErrs(null);

    try {
      await appContainer.apiv3Post('/pages/duplicate', { pageId, pageNameInput, isRecursively: isDuplicateRecursively });
      window.location.href = encodeURI(`${pageNameInput}?duplicated=${path}`);
    }
    catch (err) {
      setErrs(err);
    }
  }

  function ppacSubmitHandler() {
    duplicate();
  }

  return (
    <Modal size="lg" isOpen={isOpened} toggle={closeDuplicateModal} className="grw-duplicate-page" autoFocus={false}>
      <ModalHeader tag="h4" toggle={closeDuplicateModal} className="bg-primary text-light">
        { t('modal_duplicate.label.Duplicate page') }
      </ModalHeader>
      <ModalBody>
        <div className="form-group"><label>{t('modal_duplicate.label.Current page name')}</label><br />
          <code>{path}</code>
        </div>
        <div className="form-group">
          <label htmlFor="duplicatePageName">{ t('modal_duplicate.label.New page name') }</label><br />
          <div className="input-group">
            <div className="input-group-prepend">
              <span className="input-group-text">{crowi.url}</span>
            </div>
            <div className="flex-fill">
              {isReachable
                ? (
                  <PagePathAutoComplete
                    initializedPath={path}
                    onSubmit={ppacSubmitHandler}
                    onInputChange={ppacInputChangeHandler}
                    autoFocus
                  />
                )
                : (
                  <input
                    type="text"
                    value={pageNameInput}
                    className="form-control"
                    onChange={e => inputChangeHandler(e.target.value)}
                    required
                  />
                )}
            </div>
          </div>
        </div>
        <div className="custom-control custom-checkbox custom-checkbox-warning mb-3">
          <input
            className="custom-control-input"
            name="recursively"
            id="cbDuplicateRecursively"
            type="checkbox"
            checked={isDuplicateRecursively}
            onChange={changeIsDuplicateRecursivelyHandler}
          />
          <label className="custom-control-label" htmlFor="cbDuplicateRecursively">
            { t('modal_duplicate.label.Recursively') }
            <p className="form-text text-muted mt-0">{ t('modal_duplicate.help.recursive') }</p>
          </label>

          <div>
            {isDuplicateRecursively && existingPaths.length !== 0 && (
              <div className="custom-control custom-checkbox custom-checkbox-warning">
                <input
                  className="custom-control-input"
                  name="withoutExistRecursively"
                  id="cbDuplicatewithoutExistRecursively"
                  type="checkbox"
                  checked={isDuplicateRecursivelyWithoutExistPath}
                  onChange={changeIsDuplicateRecursivelyWithoutExistPathHandler}
                />
                <label className="custom-control-label" htmlFor="cbDuplicatewithoutExistRecursively">
                  { t('modal_duplicate.label.Duplicate without exist path') }
                </label>
              </div>
            )}
          </div>
          <div>
            {isDuplicateRecursively && path != null && <ComparePathsTable path={path} subordinatedPages={subordinatedPages} newPagePath={pageNameInput} />}
            {isDuplicateRecursively && existingPaths.length !== 0 && <DuplicatePathsTable existingPaths={existingPaths} oldPagePath={pageNameInput} />}
          </div>
        </div>

      </ModalBody>
      <ModalFooter>
        <ApiErrorMessageList errs={errs} targetPath={pageNameInput} />
        <button
          type="button"
          className="btn btn-primary"
          onClick={duplicate}
          disabled={(isDuplicateRecursively && !isDuplicateRecursivelyWithoutExistPath && existingPaths.length !== 0)}
        >
          { t('modal_duplicate.label.Duplicate page') }
        </button>
      </ModalFooter>
    </Modal>
  );
};


/**
 * Wrapper component for using unstated
 */
const PageDuplicateModallWrapper = withUnstatedContainers(PageDuplicateModal, [AppContainer]);


PageDuplicateModal.propTypes = {
  t: PropTypes.func.isRequired, //  i18next
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
};

export default withTranslation()(PageDuplicateModallWrapper);

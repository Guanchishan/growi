import React from 'react';
import PropTypes from 'prop-types';

import { withTranslation } from 'react-i18next';

import AppContainer from '~/client/services/AppContainer';
import PageContainer from '~/client/services/PageContainer';

import { withUnstatedContainers } from './UnstatedUtils';

/**
 *
 * @author Yuki Takei <yuki@weseek.co.jp>
 *
 * @export
 * @class PageStatusAlert
 * @extends {React.Component}
 */

class PageStatusAlert extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
    };

    this.getContentsForSomeoneEditingAlert = this.getContentsForSomeoneEditingAlert.bind(this);
    this.getContentsForRevisionOutdated = this.getContentsForRevisionOutdated.bind(this);
    this.getContentsForDraftExistsAlert = this.getContentsForDraftExistsAlert.bind(this);
    this.getContentsForUpdatedAlert = this.getContentsForUpdatedAlert.bind(this);
  }

  refreshPage() {
    window.location.reload();
  }

  getContentsForSomeoneEditingAlert() {
    const { t } = this.props;
    return [
      ['bg-success', 'd-hackmd-none'],
      <>
        <i className="icon-fw icon-people"></i>
        {t('hackmd.someone_editing')}
      </>,
      <a href="#hackmd" className="btn btn-outline-white">
        <i className="fa fa-fw fa-file-text-o mr-1"></i>
        Open HackMD Editor
      </a>,
    ];
  }

  getContentsForRevisionOutdated() {
    const { t, pageContainer } = this.props;
    return [
      ['bg-warning', 'd-hackmd-none'],
      <>
        <i className="icon-fw icon-pencil"></i>
        {t('modal_resolve_conflict.file_conflicting_with_newer_remote')}
      </>,
      <>
        <button type="button" onClick={() => { window.location.href = pageContainer.state.path }} className="btn btn-outline-white mr-4">
          <i className="icon-fw icon-reload mr-1"></i>
          {t('modal_resolve_conflict.reload')}
        </button>
        <button type="button" onClick={() => pageContainer.setState({ isConflictDiffModalOpen: true })} className="btn btn-outline-white">
          <i className="fa fa-fw fa-file-text-o mr-1"></i>
          {t('modal_resolve_conflict.resolve_conflict')}
        </button>
      </>,
    ];
  }

  getContentsForDraftExistsAlert(isRealtime) {
    const { t } = this.props;
    return [
      ['bg-success', 'd-hackmd-none'],
      <>
        <i className="icon-fw icon-pencil"></i>
        {t('hackmd.this_page_has_draft')}
      </>,
      <a href="#hackmd" className="btn btn-outline-white">
        <i className="fa fa-fw fa-file-text-o mr-1"></i>
        Open HackMD Editor
      </a>,
    ];
  }

  getContentsForUpdatedAlert() {
    const { t } = this.props;
    const label1 = t('edited this page');
    const label2 = t('Load latest');

    return [
      ['bg-warning'],
      <>
        <i className="icon-fw icon-bulb"></i>
        {this.props.pageContainer.state.lastUpdateUsername} {label1}
      </>,
      <a href="#" className="btn btn-outline-white" onClick={this.refreshPage}>
        <i className="icon-fw icon-reload mr-1"></i>
        {label2}
      </a>,
    ];
  }

  render() {
    const {
      revisionId, revisionIdHackmdSynced, remoteRevisionId, hasDraftOnHackmd, isHackmdDraftUpdatingInRealtime, isConflictingOnSave,
    } = this.props.pageContainer.state;

    const isRevisionOutdated = revisionId !== remoteRevisionId;
    const isHackmdDocumentOutdated = revisionIdHackmdSynced !== remoteRevisionId;

    let getContentsFunc = null;
    console.log('isConflictingOnSave:', isConflictingOnSave);
    // when conflicting on save
    if (isConflictingOnSave) {
      getContentsFunc = this.getContentsForRevisionOutdated;
    }
    // when remote revision is newer than both
    else if (isHackmdDocumentOutdated && isRevisionOutdated) {
      getContentsFunc = this.getContentsForUpdatedAlert;
    }
    // when someone editing with HackMD
    else if (isHackmdDraftUpdatingInRealtime) {
      getContentsFunc = this.getContentsForSomeoneEditingAlert;
    }
    // when the draft of HackMD is newest
    else if (hasDraftOnHackmd) {
      getContentsFunc = this.getContentsForDraftExistsAlert;
    }
    // do not render anything
    else {
      return null;
    }

    const [additionalClasses, label, btn] = getContentsFunc();

    console.log('return:', additionalClasses, label, btn);
    this.props.pageContainer.setState({ isConflictDiffModalOpen: true });

    return (
      <div className={`card grw-page-status-alert text-white fixed-bottom animated fadeInUp faster ${additionalClasses.join(' ')}`}>
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
  }

}

/**
 * Wrapper component for using unstated
 */
const PageStatusAlertWrapper = withUnstatedContainers(PageStatusAlert, [AppContainer, PageContainer]);

PageStatusAlert.propTypes = {
  t: PropTypes.func.isRequired, // i18next

  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  pageContainer: PropTypes.instanceOf(PageContainer).isRequired,
};

export default withTranslation()(PageStatusAlertWrapper);

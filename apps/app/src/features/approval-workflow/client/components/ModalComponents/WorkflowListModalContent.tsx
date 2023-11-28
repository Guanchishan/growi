// TODO: https://redmine.weseek.co.jp/issues/130336
import React, { useState, useCallback } from 'react';

import nodePath from 'path';

import { format } from 'date-fns';
import { useTranslation } from 'next-i18next';
import {
  ModalBody, ModalFooter, Dropdown, DropdownMenu, DropdownToggle, DropdownItem, UncontrolledTooltip,
} from 'reactstrap';

import { useCurrentUser } from '~/stores/context';
import { useCurrentPagePath } from '~/stores/page';

import { type IWorkflowHasId } from '../../../interfaces/workflow';
import { isWorkflowNameSet } from '../../../utils/workflow';
import { deleteWorkflow } from '../../services/workflow';

import { WorkflowModalHeader } from './WorkflowModalHeader';


type Props = {
  workflows: IWorkflowHasId[]
  onDeleted?: () => void;
  onClickCreateWorkflowButton: () => void;
  onClickShowWorkflowDetailButton: (workflowId: string) => void;
}

const formatDate = (date: Date) => {
  return format(new Date(date), 'yyyy/MM/dd HH:mm');
};

export const WorkflowListModalContent = (props: Props): JSX.Element => {
  const { t } = useTranslation();

  const {
    workflows, onDeleted, onClickCreateWorkflowButton, onClickShowWorkflowDetailButton,
  } = props;

  const [isOpenMenu, setIsOpenMenu] = useState(false);

  const { data: currentUser } = useCurrentUser();
  const { data: currentPagePath } = useCurrentPagePath();

  const pageTitle = nodePath.basename(currentPagePath ?? '') || '/';

  const createWorkflowButtonClickHandler = useCallback(() => {
    if (onClickCreateWorkflowButton == null) {
      return;
    }

    onClickCreateWorkflowButton();
  }, [onClickCreateWorkflowButton]);

  const deleteWorkflowButtonClickHandler = useCallback(async(workflowId: string) => {
    try {
      await deleteWorkflow(workflowId);
      if (onDeleted != null) {
        onDeleted();
      }
    }
    catch (err) {
      // TODO: Consider how to display errors
    }
  }, [onDeleted]);

  const showWorkflowDetailButtonClickHandler = useCallback((workflowId: string) => {
    if (onClickShowWorkflowDetailButton == null) {
      return null;
    }

    onClickShowWorkflowDetailButton(workflowId);

  }, [onClickShowWorkflowDetailButton]);

  const isDeletable = useCallback((workflow: IWorkflowHasId): boolean => {
    if (currentUser == null) {
      return false;
    }

    if (currentUser.admin) {
      return true;
    }

    const creatorAndApprovers: string[] = [workflow.creator._id];
    workflow.approverGroups.forEach((approverGroup) => {
      approverGroup.approvers.forEach((approver) => {
        creatorAndApprovers.push(approver.user.toString());
      });
    });

    if (creatorAndApprovers.includes(currentUser._id)) {
      return true;
    }

    return false;

  }, [currentUser]);

  return (
    <>
      <WorkflowModalHeader>
        <span className="fw-bold">{t('approval_workflow.list')}</span>
      </WorkflowModalHeader>

      <ModalBody>
        {(workflows.length === 0) && (
          <>{t('approval_workflow.list_not_found')}</>
        )}

        {/* TODO: Allow infinite scrolling */}
        {(workflows.length >= 1 && (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t('approval_workflow.name')}</th>
                <th scope="col">{t('approval_workflow.status')}</th>
                <th scope="col">{t('approval_workflow.applicant')}</th>
              </tr>
            </thead>

            <tbody>
              {workflows.map((workflow) => {
                return (
                  <tr data-testid="activity-table" key={workflow._id}>
                    <td>
                      { isWorkflowNameSet(workflow.name) ? workflow.name : pageTitle }
                      <div>
                        <span className="text-muted">
                          {formatDate(workflow.createdAt)}
                        </span>
                        <span className="btn btn-link text-muted" onClick={() => showWorkflowDetailButtonClickHandler(workflow._id)}>
                          {t('approval_workflow.show_detail')}
                          <i className="fa fa-fw fa-chevron-right" aria-hidden="true"></i>
                        </span>
                      </div>
                    </td>
                    <td>
                      {t(`approval_workflow.workflow_status.${workflow.status}`)}
                    </td>
                    <td>
                      {workflow.creator.username}
                    </td>
                    <td>
                      <Dropdown isOpen={isOpenMenu} toggle={() => { setIsOpenMenu(!isOpenMenu) }}>
                        <DropdownToggle color="transparent" className="border-0 rounded btn-page-item-control d-flex align-items-center justify-content-center">
                          <i className="icon-options"></i>
                        </DropdownToggle>

                        <DropdownMenu>
                          <div id="delete-workflow-button">
                            <DropdownItem
                              className={isDeletable(workflow) ? 'text-danger' : ''}
                              disabled={!isDeletable(workflow)}
                              onClick={() => { deleteWorkflowButtonClickHandler(workflow._id) }}
                            >{t('approval_workflow.delete')}
                            </DropdownItem>
                            {/* see: https://stackoverflow.com/questions/52180239/how-add-tooltip-for-disabed-button-reactstrap */}
                            { !isDeletable(workflow) && (
                              <UncontrolledTooltip
                                target="delete-workflow-button"
                                placement="bottom"
                                fade={false}
                              >
                                {t('approval_workflow.delete_button_tooltip')}
                              </UncontrolledTooltip>
                            )}
                          </div>
                        </DropdownMenu>
                      </Dropdown>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ))}
      </ModalBody>

      <ModalFooter>
        <button type="button" onClick={createWorkflowButtonClickHandler}>
          {t('approval_workflow.create')}
        </button>
      </ModalFooter>
    </>
  );
};

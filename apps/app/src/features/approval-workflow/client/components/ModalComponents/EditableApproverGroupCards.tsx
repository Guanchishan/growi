import React, { useState, useCallback } from 'react';

import type { IUserHasId } from '@growi/core';
import { useTranslation } from 'next-i18next';
import {
  Dropdown, DropdownMenu, DropdownToggle, DropdownItem, UncontrolledTooltip,
} from 'reactstrap';

import { WorkflowApprovalType, type EditingApproverGroup } from '../../../interfaces/workflow';

import { SearchUserTypeahead } from './SearchUserTypeahead';


type Props = {
  excludedSearchUserIds: string[]
  approvedApproverIds?: string[]
  editingApproverGroups: EditingApproverGroup[]
  latestApprovedApproverGroupIndex?: number
  onUpdateApproverGroups?: (groupIndex: number, updateApproverGroupData: EditingApproverGroup) => void
  onClickAddApproverGroupCard?: (groupIndex: number) => void
  onClickRemoveApproverGroupCard?: (groupIndex: number) => void
}

const EditableApproverGroupCard = (props: Props & { groupIndex: number }): JSX.Element => {
  const {
    groupIndex,
    approvedApproverIds,
    editingApproverGroups,
    excludedSearchUserIds,
    latestApprovedApproverGroupIndex,
    onUpdateApproverGroups,
    onClickAddApproverGroupCard,
    onClickRemoveApproverGroupCard,
  } = props;

  const { t } = useTranslation();

  const [isOpenChangeApprovalTypeMenu, setIsOpenChangeApprovalTypeMenu] = useState(false);

  const editingApproverGroup = editingApproverGroups?.[groupIndex];
  const editingApprovalType = editingApproverGroup.approvalType ?? WorkflowApprovalType.AND;

  const isEditable = latestApprovedApproverGroupIndex == null ? true : groupIndex > latestApprovedApproverGroupIndex;
  const isCreatableButtomApproverGroup = (isEditable && editingApproverGroup.approvers.length > 0) || (groupIndex === latestApprovedApproverGroupIndex);
  const isCreatableTopApporverGroup = isCreatableButtomApproverGroup && groupIndex === 0;
  const isDeletebleEditingApproverGroup = isEditable && editingApproverGroups.length > 1;
  const isChangeableApprovealType = isEditable && editingApproverGroup.approvers.length > 1;
  const isApprovalTypeAnd = editingApprovalType === WorkflowApprovalType.AND;

  // for updated
  const selectedUsers = editingApproverGroup.approvers.map(approver => approver.user);

  const changeApprovalTypeButtonClickHandler = useCallback((approvalType: WorkflowApprovalType) => {
    const clonedApproverGroup = { ...editingApproverGroup };
    clonedApproverGroup.approvalType = approvalType;

    if (onUpdateApproverGroups != null) {
      onUpdateApproverGroups(groupIndex, clonedApproverGroup);
    }
  }, [editingApproverGroup, groupIndex, onUpdateApproverGroups]);

  const updateApproversHandler = useCallback((users: IUserHasId[]) => {
    const clonedApproverGroup = { ...editingApproverGroup };
    const approvers = users.map(user => ({ user }));
    clonedApproverGroup.approvers = approvers;

    if (users.length <= 1) {
      clonedApproverGroup.approvalType = WorkflowApprovalType.AND;
    }

    if (onUpdateApproverGroups != null) {
      onUpdateApproverGroups(groupIndex, clonedApproverGroup);
    }
  }, [editingApproverGroup, groupIndex, onUpdateApproverGroups]);

  const removeApproverHandler = useCallback((user: IUserHasId) => {
    const clonedApproverGroup = { ...editingApproverGroup };
    clonedApproverGroup.approvers = clonedApproverGroup.approvers.filter(v => v.user._id !== user._id);

    if (clonedApproverGroup.approvers.length <= 1) {
      clonedApproverGroup.approvalType = WorkflowApprovalType.AND;
    }

    if (onUpdateApproverGroups != null) {
      onUpdateApproverGroups(groupIndex, clonedApproverGroup);
    }
  }, [editingApproverGroup, groupIndex, onUpdateApproverGroups]);

  const removeApproverGroupCardHandler = useCallback(() => {
    if (onClickRemoveApproverGroupCard != null && isDeletebleEditingApproverGroup) {
      onClickRemoveApproverGroupCard(groupIndex);
    }
  }, [groupIndex, isDeletebleEditingApproverGroup, onClickRemoveApproverGroupCard]);

  return (
    <>
      {onClickAddApproverGroupCard != null && groupIndex === 0 && (
        <div className="text-center my-2">
          <button
            type="button"
            disabled={!isCreatableTopApporverGroup}
            onClick={() => onClickAddApproverGroupCard(Math.max(0, groupIndex - 1))}
          >
            <div>
              <i className="fa-solid fa-plus"></i>
            </div>
            {t('approval_workflow.add_flow')}
          </button>
        </div>
      )}

      <div className="card rounded">
        <div className="card-body">

          <div className="d-flex justify-content-center align-items-center">
            <SearchUserTypeahead
              isEditable={isEditable}
              selectedUsers={selectedUsers}
              approvedApproverIds={approvedApproverIds}
              excludedSearchUserIds={excludedSearchUserIds}
              onChange={updateApproversHandler}
              onRemoveApprover={removeApproverHandler}
              onRemoveLastEddtingApprover={removeApproverGroupCardHandler}
            />

            { isDeletebleEditingApproverGroup && onClickRemoveApproverGroupCard != null && (
              <button type="button" className="btn-close justify-content-end" aria-label="Close" onClick={removeApproverGroupCardHandler}></button>
            )}
          </div>

          <div className="d-flex justify-content-center align-items-center mt-3">

            <span className="text-muted">
              {t('approval_workflow.completion_conditions')}
            </span>

            <Dropdown isOpen={isOpenChangeApprovalTypeMenu} toggle={() => { setIsOpenChangeApprovalTypeMenu(!isOpenChangeApprovalTypeMenu) }}>
              <div id="change-approval-type-button">
                <DropdownToggle
                  className="btn btn-light btn-sm rounded-pill dropdown-toggle"
                  disabled={!isChangeableApprovealType}
                >
                  {t(`approval_workflow.approval_type.${editingApprovalType}`)}
                </DropdownToggle>
                {/* see: https://stackoverflow.com/questions/52180239/how-add-tooltip-for-disabed-button-reactstrap */}
                { !isChangeableApprovealType && (
                  <UncontrolledTooltip
                    target="change-approval-type-button"
                    placement="bottom"
                    fade={false}
                  >
                    {t('approval_workflow.cannot_change_approval_type')}
                  </UncontrolledTooltip>
                )}
              </div>

              <DropdownMenu>
                <DropdownItem
                  onClick={() => changeApprovalTypeButtonClickHandler(isApprovalTypeAnd ? WorkflowApprovalType.OR : WorkflowApprovalType.AND)}
                >  { isApprovalTypeAnd
                    ? <>{t('approval_workflow.approval_type.OR')}</>
                    : <>{t('approval_workflow.approval_type.AND')}</>
                  }
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>

      {onClickAddApproverGroupCard != null && (
        <div className="text-center my-2">
          <button
            type="button"
            disabled={!isCreatableButtomApproverGroup}
            onClick={() => onClickAddApproverGroupCard(Math.max(0, groupIndex + 1))}
          >
            <div>
              <i className="fa-solid fa-plus"></i>
            </div>
            {t('approval_workflow.add_flow')}
          </button>
        </div>
      )}
    </>
  );
};

export const EditableApproverGroupCards = (props: Props): JSX.Element => {
  return (
    <>
      {props.editingApproverGroups?.map((data, index) => (
        <EditableApproverGroupCard
          key={data.uuidForRenderList}
          groupIndex={index}
          {...props}
        />
      ))}
    </>
  );
};

import React, { type FC } from 'react';

import {
  SimpleItem, useNewPageInput, type TreeItemProps,
} from '../TreeItem';

type PageTreeItemProps = TreeItemProps & {
  key?: React.Key | null,
};

export const TreeItemForModal: FC<PageTreeItemProps> = (props) => {

  const { isOpen } = props;
  const { Input: NewPageInput, CreateButton: NewPageCreateButton } = useNewPageInput();

  return (
    <SimpleItem
      key={props.key}
      targetPathOrId={props.targetPathOrId}
      itemNode={props.itemNode}
      isOpen={isOpen}
      isEnableActions={props.isEnableActions}
      isReadOnlyUser={props.isReadOnlyUser}
      onClickDuplicateMenuItem={props.onClickDuplicateMenuItem}
      onClickDeleteMenuItem={props.onClickDeleteMenuItem}
      onRenamed={props.onRenamed}
      customNextComponents={[NewPageInput]}
      itemClass={TreeItemForModal}
      customEndComponents={[NewPageCreateButton]}
    />
  );
};

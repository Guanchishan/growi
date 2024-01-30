import React from 'react';

import { useTranslation } from 'react-i18next';
import { DropdownMenu, DropdownItem } from 'reactstrap';

import { LabelType } from '~/interfaces/template';


type DropendMenuProps = {
  onClickCreateNewPageButtonHandler: () => Promise<void>
  onClickCreateTodaysButtonHandler: () => Promise<void>
  onClickTemplateButtonHandler: (label: LabelType) => Promise<void>
  todaysPath: string | null,
}

export const DropendMenu = React.memo((props: DropendMenuProps): JSX.Element => {
  const {
    onClickCreateNewPageButtonHandler,
    onClickCreateTodaysButtonHandler,
    onClickTemplateButtonHandler,
    todaysPath,
  } = props;

  const { t } = useTranslation('commons');

  return (
    <DropdownMenu
      container="body"
    >
      <DropdownItem
        onClick={onClickCreateNewPageButtonHandler}
      >
        {t('create_page_dropdown.new_page')}
      </DropdownItem>
      {todaysPath != null && (
        <>
          <DropdownItem divider />
          <li><span className="text-muted px-3">{t('create_page_dropdown.todays.desc')}</span></li>
          <DropdownItem
            onClick={onClickCreateTodaysButtonHandler}
          >
            {todaysPath}
          </DropdownItem>
        </>
      )}
      <DropdownItem divider />
      <li><span className="text-muted text-nowrap px-3">{t('create_page_dropdown.template.desc')}</span></li>
      <DropdownItem
        onClick={() => onClickTemplateButtonHandler('_template')}
      >
        {t('create_page_dropdown.template.children')}
      </DropdownItem>
      <DropdownItem
        onClick={() => onClickTemplateButtonHandler('__template')}
      >
        {t('create_page_dropdown.template.descendants')}
      </DropdownItem>
    </DropdownMenu>
  );
});
DropendMenu.displayName = 'DropendMenu';

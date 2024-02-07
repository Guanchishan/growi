import {
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';

import type { GlobalCodeMirrorEditorKey } from '../../../consts';
import { AcceptedUploadFileType } from '../../../consts/accepted-upload-file-type';

import { AttachmentsButton } from './AttachmentsButton';
import { LinkEditButton } from './LinkEditButton';

type Props = {
  editorKey: string | GlobalCodeMirrorEditorKey,
  onFileOpen: () => void,
  acceptedFileType: AcceptedUploadFileType,
}

export const AttachmentsDropup = (props: Props): JSX.Element => {
  const { onFileOpen, acceptedFileType, editorKey } = props;

  return (
    <>
      <UncontrolledDropdown direction="up" className="lh-1">
        <DropdownToggle className="btn-toolbar-button rounded-circle">
          <span className="material-symbols-outlined fs-6">add</span>
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem className="mt-1" header>
            Attachments
          </DropdownItem>
          <DropdownItem divider />
          <AttachmentsButton onFileOpen={onFileOpen} acceptedFileType={acceptedFileType} />
          <LinkEditButton editorKey={editorKey} />
        </DropdownMenu>
      </UncontrolledDropdown>
    </>
  );
};

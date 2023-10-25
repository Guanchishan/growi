import { useCallback } from 'react';

import { useDropzone, Accept } from 'react-dropzone';
import type { DropzoneState } from 'react-dropzone';

import { AcceptedUploadFileType } from '../../consts';

type DropzoneEditor = {
  onUpload?: (files: File[]) => void,
  acceptedFileType: AcceptedUploadFileType,
}

export const useFileDropzone = (props: DropzoneEditor): DropzoneState => {

  const { onUpload, acceptedFileType } = props;

  const dropHandler = useCallback((acceptedFiles: File[]) => {
    if (onUpload == null) {
      return;
    }
    onUpload(acceptedFiles);
  }, [onUpload]);

  const accept: Accept = {
    acceptedFileType: [],
  };

  const disabled = acceptedFileType === AcceptedUploadFileType.NONE;

  return useDropzone({
    noKeyboard: true,
    noClick: true,
    disabled,
    onDrop: dropHandler,
    accept,
  });

};

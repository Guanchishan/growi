export const PageActionType = {
  Create: 'Create',
  Update: 'Update',
  Rename: 'Rename',
  Duplicate: 'Duplicate',
  Delete: 'Delete',
  DeleteCompletely: 'DeleteCompletely',
  Revert: 'Revert',
  NormalizeParent: 'NormalizeParent',
} as const;
export type PageActionType = typeof PageActionType[keyof typeof PageActionType];

export const PageActionStage = {
  Main: 'Main',
  Sub: 'Sub',
} as const;
export type PageActionStage = typeof PageActionStage[keyof typeof PageActionStage];

export type IPageOperationProcessData = {
  [key in PageActionType]?: {
    [PageActionStage.Main]?: { isProcessable: boolean },
    [PageActionStage.Sub]?: { isProcessable: boolean },
  }
}

export type IPageOperationProcessInfo = {
  [pageId: string]: IPageOperationProcessData,
}

export type OptionsToSave = {
  isSlackEnabled: boolean;
  slackChannels: string;
  grant: number;
  pageTags: string[] | null;
  grantUserGroupId?: string | null;
  grantUserGroupName?: string | null;
  isSyncRevisionToHackmd?: boolean;
};

export const SaveByModalType = {
  DRAWIO: 'drawio',
  HANDSONTABLE: 'handsontable',
} as const;

export type SaveByModalType = typeof SaveByModalType[keyof typeof SaveByModalType];

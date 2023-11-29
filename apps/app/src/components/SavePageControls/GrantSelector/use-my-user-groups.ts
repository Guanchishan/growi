import { GroupType } from '@growi/core';

import { useSWRxMyExternalUserGroups } from '~/features/external-user-group/client/stores/external-user-group';
import { useSWRxMyUserGroups } from '~/stores/user-group';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useMyUserGroups = (shouldFetch: boolean) => {
  const { data: myUserGroups, mutate: mutateMyUserGroups } = useSWRxMyUserGroups(shouldFetch);
  const { data: myExternalUserGroups, mutate: mutateMyExternalUserGroups } = useSWRxMyExternalUserGroups(shouldFetch);

  const update = () => {
    mutateMyUserGroups();
    mutateMyExternalUserGroups();
  };

  if (myUserGroups == null || myExternalUserGroups == null) {
    return { data: null, update };
  }

  const myUserGroupsData = myUserGroups
    .map((group) => {
      return {
        item: group,
        type: GroupType.userGroup,
      };
    });
  const myExternalUserGroupsData = myExternalUserGroups
    .map((group) => {
      return {
        item: group,
        type: GroupType.externalUserGroup,
      };
    });

  const data = [...myUserGroupsData, ...myExternalUserGroupsData];

  return { data, update };
};

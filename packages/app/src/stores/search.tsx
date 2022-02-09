import { SWRResponse } from 'swr';
import useSWRImmutable from 'swr/immutable';

import { apiv3Get } from '~/client/util/apiv3-client';

import { IFormattedSearchResult, SORT_AXIS, SORT_ORDER } from '~/interfaces/search';


export type ISearchConfigurations = {
  limit: number,
  offset?: number,
  sort?: SORT_AXIS,
  order?: SORT_ORDER,
  includeTrashPages?: boolean,
  includeUserPages?: boolean,
}

export type ISearchConditions = {
  q: string,
  configurations: ISearchConfigurations,
}

const createSearchQuery = (keyword: string, includeTrashPages = false, includeUserPages = false): string => {
  let query = keyword;

  // pages included in specific path are not retrived when prefix is added
  if (!includeTrashPages) {
    query = `${query} -prefix:/trash`;
  }
  if (!includeUserPages) {
    query = `${query} -prefix:/user`;
  }

  return query;
};

export const useSWRxFullTextSearch = (
    keyword: string, configurations: ISearchConfigurations,
): SWRResponse<IFormattedSearchResult, Error> & ISearchConditions => {

  const {
    includeTrashPages, includeUserPages,
  } = configurations;

  const q = createSearchQuery(keyword, includeTrashPages, includeUserPages);

  const swrResult = useSWRImmutable(
    ['/search', keyword, configurations],
    (endpoint, keyword, configurations) => {
      const {
        limit, offset, sort, order,
      } = configurations;

      return apiv3Get<IFormattedSearchResult>(
        endpoint, {
          q,
          limit,
          offset: offset ?? 0,
          sort: sort ?? SORT_AXIS.RELATION_SCORE,
          order: order ?? SORT_ORDER.DESC,
        },
      ).then(result => result.data);
    },
  );

  return {
    ...swrResult,
    q,
    configurations,
  };
};

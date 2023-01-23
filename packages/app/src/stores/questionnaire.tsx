import useSWR, { SWRResponse } from 'swr';

import { apiv3Get } from '~/client/util/apiv3-client';
import { IQuestionnaireOrderHasId } from '~/interfaces/questionnaire/questionnaire-order';

export const useSWRxQuestionnaireOrders = (): SWRResponse<IQuestionnaireOrderHasId[], Error> => {
  return useSWR(
    '/questionnaire/questionnaire-orders',
    endpoint => apiv3Get(endpoint).then((response) => {
      return response.data.questionnaireOrders;
    }),
  );
};

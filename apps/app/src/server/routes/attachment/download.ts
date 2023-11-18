import express from 'express';
import type { Router } from 'express';

import { SupportedAction } from '~/interfaces/activity';
import type { CrowiRequest } from '~/interfaces/crowi-request';
import loggerFactory from '~/utils/logger';

import type Crowi from '../../crowi';
import { certifySharedPageAttachmentMiddleware } from '../../middlewares/certify-shared-page-attachment';

import {
  GetRequest, GetResponse, getActionFactory, validateGetRequest,
} from './get';


const logger = loggerFactory('growi:routes:attachment:download');


const generateActivityParameters = (req: CrowiRequest) => {
  return {
    ip:  req.ip,
    endpoint: req.originalUrl,
    action: SupportedAction.ACTION_ATTACHMENT_DOWNLOAD,
    user: req.user?._id,
    snapshot: {
      username: req.user?.username,
    },
  };
};

export const downloadRouterFactory = (crowi: Crowi): Router => {

  const loginRequired = require('../../middlewares/login-required')(crowi, true);

  const router = express.Router();

  // note: validateGetRequest requires `req.params.id`
  router.get<{ id: string }>('/:id([0-9a-z]{24})',
    certifySharedPageAttachmentMiddleware, loginRequired, validateGetRequest,
    async(req: GetRequest, res: GetResponse) => {
      const { attachment } = res.locals;

      const activityParameters = generateActivityParameters(req);
      const createActivity = async() => {
        await crowi.activityService.createActivity(activityParameters);
      };

      res.set({
        'Content-Disposition': `attachment;filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`,
      });

      const getAction = getActionFactory(crowi, attachment);
      await getAction(req, res);

      createActivity();
    });

  return router;
};

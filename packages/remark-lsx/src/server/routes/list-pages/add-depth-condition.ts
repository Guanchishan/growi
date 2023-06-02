import { OptionParser } from '@growi/core/dist/plugin';
import { pagePathUtils } from '@growi/core/dist/utils';
import createError from 'http-errors';

import type { PageQuery } from './generate-base-query';

const { isTopPage } = pagePathUtils;

export const addDepthCondition = (query: PageQuery, pagePath: string, optionsDepth: string): PageQuery => {

  const range = OptionParser.parseRange(optionsDepth);

  if (range == null) {
    return query;
  }

  const start = range.start;
  const end = range.end;

  // check start
  if (start < 1) {
    throw createError(400, `The specified option 'depth' is { start: ${start}, end: ${end} } : the start must be larger or equal than 1`);
  }
  // check end
  if (start > end && end > 0) {
    throw createError(400, `The specified option 'depth' is { start: ${start}, end: ${end} } : the end must be larger or equal than the start`);
  }

  // count slash
  const slashNum = isTopPage(pagePath)
    ? 1
    : pagePath.split('/').length;
  const depthStart = slashNum + start - 1;
  const depthEnd = slashNum + end - 1;

  if (end < 0) {
    return query.and([
      { path: new RegExp(`^(\\/[^\\/]*){${depthStart},}$`) },
    ]);
  }

  return query.and([
    { path: new RegExp(`^(\\/[^\\/]*){${depthStart},${depthEnd}}$`) },
  ]);
};

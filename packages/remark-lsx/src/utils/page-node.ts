import * as url from 'url';

import { IPageHasId, ParseRangeResult, pathUtils } from '@growi/core';
import { isTopPage } from '@growi/core/dist/utils/page-path-utils';

import type { PageNode } from '../interfaces/page-node';

function getDepthOfPath(path: string) {
  if (isTopPage(path)) {
    return 0;
  }
  return (path.match(/\//g) ?? []).length;
}

function getParentPath(path: string) {
  return pathUtils.removeTrailingSlash(decodeURIComponent(url.resolve(path, './')));
}

/**
 * generate PageNode instances for target page and the ancestors
 *
 * @param {any} pathToNodeMap
 * @param {any} rootPagePath
 * @param {any} pagePath
 * @returns
 * @memberof Lsx
 */
function generatePageNode(
    pathToNodeMap: Record<string, PageNode>, rootPagePath: string, pagePath: string, depthRange?: ParseRangeResult | null,
): PageNode | null {

  const depthStartToProcess = getDepthOfPath(rootPagePath) + (depthRange?.start ?? 0); // at least 1
  const currentPageDepth = getDepthOfPath(pagePath);

  // return by the depth restriction
  // '/' will also return null because the depth is 0
  if (currentPageDepth < depthStartToProcess) {
    return null;
  }

  // return when already registered
  if (pathToNodeMap[pagePath] != null) {
    return pathToNodeMap[pagePath];
  }

  // generate node
  const node = { pagePath, children: [] };
  pathToNodeMap[pagePath] = node;

  /*
    * process recursively for ancestors
    */
  // get or create parent node
  const parentPath = getParentPath(pagePath);
  const parentNode = generatePageNode(pathToNodeMap, rootPagePath, parentPath, depthRange);
  // associate to patent
  if (parentNode != null) {
    parentNode.children.push(node);
  }

  return node;
}

export function generatePageNodeTree(rootPagePath: string, pages: IPageHasId[], depthRange?: ParseRangeResult | null): PageNode[] {
  const pathToNodeMap: Record<string, PageNode> = {};

  pages.forEach((page) => {
    const node = generatePageNode(pathToNodeMap, rootPagePath, page.path, depthRange); // this will not be null

    // exclude rootPagePath itself
    if (node == null) {
      return;
    }

    // set the Page substance
    node.page = page;
  });

  // return root objects
  const rootNodes: PageNode[] = [];
  Object.keys(pathToNodeMap).forEach((pagePath) => {
    // exclude '/'
    if (pagePath === '/') {
      return;
    }

    const parentPath = getParentPath(pagePath);

    // pick up what parent doesn't exist
    if ((parentPath === '/') || !(parentPath in pathToNodeMap)) {
      rootNodes.push(pathToNodeMap[pagePath]);
    }
  });
  return rootNodes;
}

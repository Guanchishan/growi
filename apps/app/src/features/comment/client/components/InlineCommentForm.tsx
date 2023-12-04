import { useCallback, useState } from 'react';

import getXPath from 'get-xpath';
import TextAnnotator from 'text-annotator-v2';

import type { TextAnnotatorInterface } from '../@types/text-annotator-v2';

const isElement = (node: Node): node is Element => {
  return 'innerHTML' in node;
};

const retrieveFirstLevelElement = (target: Node, root: Element): Node | null => {
  if (target === root || target.parentElement == null) {
    return null;
  }
  if (target.parentElement === root) {
    return target;
  }

  return retrieveFirstLevelElement(target.parentElement, root);
};

const getElementByXpath = (xpath: string): Node | null => {
  return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
};

type Props = {
  range: Range,
  onExit?: () => void,
}

export const InlineCommentForm = (props: Props): JSX.Element => {
  const { range, onExit } = props;

  const [input, setInput] = useState('');

  const submitHandler = useCallback(() => {
    const wikiElements = document.getElementsByClassName('wiki');

    if (wikiElements.length === 0) return;

    const firstLevelElement = retrieveFirstLevelElement(range.commonAncestorContainer, wikiElements[0]);

    if (firstLevelElement == null) {
      onExit?.();
    }

    console.log({ input, range, firstLevelElement });

    if (firstLevelElement != null && isElement(firstLevelElement)) {
      const annotator: TextAnnotatorInterface = new TextAnnotator(firstLevelElement.innerHTML);
      const annotationIndex = annotator.search(range.toString());

      if (annotationIndex > -1) {
        const annotated = annotator.annotate(annotationIndex);
        const wikiElemXpath = getXPath(wikiElements[0]);
        const xpath = getXPath(firstLevelElement);
        const xpathRelative = xpath.slice(wikiElemXpath.length);
        console.log({
          wikiElemXpath, xpath, xpathRelative, annotated,
        });

        // WIP: restore annotated html from xpathRelative
        const targetElement = getElementByXpath(wikiElemXpath + xpathRelative);
        if (targetElement != null && isElement(targetElement)) {
          console.log('replace innerHTML');
          targetElement.innerHTML = annotated;
        }
      }
    }

    onExit?.();
  }, [input, range, onExit]);

  return (
    <form onSubmit={submitHandler}>
      <div className="d-flex gap-1">
        <input
          type="text"
          className="form-control form-control-sm border-0"
          autoFocus
          placeholder="Input comment.."
          onChange={e => setInput(e.target.value)}
          aria-describedby="inlineComment"
        />
        <button type="button" className="btn btn-sm btn-muted">
          <span className="material-symbols-outlined">alternate_email</span>
        </button>
        <button type="button" className="btn btn-sm btn-muted" onClick={submitHandler}>
          <span className="material-symbols-outlined">send</span>
        </button>
      </div>
    </form>
  );
};

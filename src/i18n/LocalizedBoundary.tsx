import { useEffect, useRef, type PropsWithChildren } from 'react';

import { useLocale } from './useLocale';

const textNodeSources = new WeakMap<Text, string>();
const translatableAttributes = ['aria-label', 'placeholder', 'title', 'alt'] as const;

function shouldSkipTextNode(node: Text) {
  const parent = node.parentElement;

  if (!parent) return true;
  if (parent.closest('[data-i18n-skip="true"]')) return true;

  const tagName = parent.tagName.toLowerCase();
  return ['script', 'style', 'textarea', 'code', 'pre'].includes(tagName);
}

function translateTextNodes(root: HTMLElement, translate: (source: string) => string) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];

  while (walker.nextNode()) {
    const currentNode = walker.currentNode as Text;
    if (shouldSkipTextNode(currentNode)) continue;
    if (!currentNode.nodeValue?.trim()) continue;
    nodes.push(currentNode);
  }

  nodes.forEach((node) => {
    const source = textNodeSources.get(node) ?? node.nodeValue ?? '';
    textNodeSources.set(node, source);

    const translated = translate(source);
    if (node.nodeValue !== translated) {
      node.nodeValue = translated;
    }
  });
}

function translateElementAttributes(root: HTMLElement, translate: (source: string) => string) {
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];

  elements.forEach((element) => {
    if (element.closest('[data-i18n-skip="true"]')) return;

    translatableAttributes.forEach((attribute) => {
      const currentValue = element.getAttribute(attribute);
      if (!currentValue?.trim()) return;

      const sourceAttribute = `data-i18n-source-${attribute}`;
      const source = element.getAttribute(sourceAttribute) ?? currentValue;
      element.setAttribute(sourceAttribute, source);

      const translated = translate(source);
      if (currentValue !== translated) {
        element.setAttribute(attribute, translated);
      }
    });
  });
}

export default function LocalizedBoundary({ children }: PropsWithChildren) {
  const { t, locale } = useLocale();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let translating = false;
    let frameId = 0;

    function translateTree() {
      if (!rootRef.current || translating) return;

      translating = true;
      translateTextNodes(rootRef.current, t);
      translateElementAttributes(rootRef.current, t);
      translating = false;
    }

    function scheduleTranslate() {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(translateTree);
    }

    translateTree();

    const observer = new MutationObserver((mutations) => {
      if (translating) return;
      if (
        mutations.every(
          (mutation) =>
            mutation.type === 'attributes' &&
            mutation.attributeName?.startsWith('data-i18n-source-')
        )
      ) {
        return;
      }

      scheduleTranslate();
    });

    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...translatableAttributes, ...translatableAttributes.map((attribute) => `data-i18n-source-${attribute}`)],
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [locale, t]);

  return <div ref={rootRef}>{children}</div>;
}

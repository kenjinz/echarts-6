import { EXAMPLES, getExample } from '../app/experimentRegistry';
import { APPENDIX, CHAPTERS, LESSONS } from './catalog';
import { adjacentLesson, filterLessons } from './navigation';
import type { PresentationMode, Selection, UtilityPanel, Variant } from './types';

export interface PresentationCallbacks {
  select(selection: Selection): void;
  mode(mode: PresentationMode): void;
  search(query: string): void;
  renderEngineeringNavigation(query: string): void;
}
export interface PresentationView {
  render(selection: Selection, query: string, notice?: string): void;
  arrangeControls(selection: Selection): void;
}
function element<T extends HTMLElement = HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing presentation element: ${id}`);
  return found as T;
}
function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const item = document.createElement(tag);
  if (text) item.textContent = text;
  return item;
}
function variantFor(selection: Selection): Variant | undefined {
  return selection.mode === 'guided'
    ? LESSONS.find(l => l.id === selection.lessonId)?.variants.find(v => v.exampleId === selection.exampleId)
    : undefined;
}

// Keep fields inside their delegated event container even when advanced.
function placeInDisclosure(container: HTMLElement, primary: (item: HTMLElement) => boolean, title: string): void {
  const prior = container.querySelector<HTMLDetailsElement>(':scope > details');
  const all = Array.from(container.children).flatMap(child => child === prior
    ? Array.from(prior.querySelector<HTMLElement>(':scope > .advanced-content')!.children)
    : [child]).filter((child): child is HTMLElement => child instanceof HTMLElement);
  const details = node('details');
  details.open = prior?.open ?? false;
  const content = node('div');
  content.className = 'advanced-content';
  details.append(node('summary', title), content);
  container.replaceChildren();
  for (const child of all) (primary(child) ? container : content).append(child);
  if (content.childElementCount) container.append(details);
}

export function createPresentationView(callbacks: PresentationCallbacks): PresentationView {
  const list = element('example-list');
  const mode = element<HTMLSelectElement>('presentation-mode');
  const variantSelect = element<HTMLSelectElement>('lesson-variant');
  const guide = element('lesson-guide');
  const technical = element('technical-content');
  const primaryUtilities = element('guided-utilities');
  const previous = element<HTMLButtonElement>('previous-lesson');
  const next = element<HTMLButtonElement>('next-lesson');
  const utilityNodes: Record<Exclude<UtilityPanel, 'exports'>, HTMLElement> = {
    state: element('state-json').closest<HTMLElement>('section')!,
    events: element('latest-event').closest<HTMLElement>('section')!,
    metrics: element('live-instances').closest<HTMLElement>('section')!,
    measurement: element('measurement-summary').closest<HTMLElement>('section')!
  };
  const resultCard = element('classification').closest<HTMLElement>('section')!;
  const version = document.querySelector<HTMLElement>('.version-stack')!;
  const badge = document.querySelector<HTMLElement>('[data-testid=example-id]')!;
  const exports = ['export-image', 'export-csv', 'export-json'].map(id => element<HTMLButtonElement>(id));
  const relocatable = [...Object.values(utilityNodes), resultCard, version, badge, ...exports];
  const homes = relocatable.map(item => {
    const anchor = document.createComment('presentation-home');
    item.before(anchor);
    return { item, anchor };
  });
  const exportPanel = node('section');
  exportPanel.className = 'card primary-export-panel';
  exportPanel.append(node('h3', 'Export results'));
  const exportActions = node('div');
  exportActions.className = 'evidence-actions';
  exportPanel.append(exportActions);
  const sourceInfo = node('p', 'Engineering example: ');
  let active: Selection = { mode: 'engineering', exampleId: 'M01' };

  mode.addEventListener('change', () => callbacks.mode(mode.value as PresentationMode));
  element<HTMLInputElement>('example-search').addEventListener('input', event => callbacks.search((event.target as HTMLInputElement).value));
  variantSelect.addEventListener('change', () => {
    if (active.mode === 'guided') callbacks.select({ ...active, exampleId: variantSelect.value });
  });
  for (const [button, delta] of [[previous, -1], [next, 1]] as const) {
    button.addEventListener('click', () => {
      if (active.mode !== 'guided') return;
      const lesson = adjacentLesson(active.lessonId, delta);
      if (lesson) callbacks.select({ mode: 'guided', lessonId: lesson.id, exampleId: lesson.variants[0].exampleId });
    });
  }
  list.addEventListener('click', event => {
    const id = (event.target as Element).closest<HTMLElement>('[data-lesson-id]')?.dataset.lessonId;
    const lesson = LESSONS.find(l => l.id === id);
    if (lesson) callbacks.select({ mode: 'guided', lessonId: lesson.id, exampleId: lesson.variants[0].exampleId });
  });
  const appendix = element('appendix-list');
  for (const entry of APPENDIX) {
    const block = node('div'); block.className = 'appendix-case';
    const link = node('a', `${entry.exampleId} · ${getExample(entry.exampleId).title}`);
    link.href = `?example=${entry.exampleId}`;
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); callbacks.select({ mode: 'engineering', exampleId: entry.exampleId });
    });
    block.append(link, node('small', entry.reason)); appendix.append(block);
  }

  function render(selection: Selection, query: string, notice?: string): void {
    active = selection;
    mode.value = selection.mode;
    document.body.dataset.presentationMode = selection.mode;
    guide.hidden = selection.mode !== 'guided';
    element('technical-appendix').hidden = selection.mode !== 'guided';
    const noticeNode = element('navigation-notice');
    noticeNode.textContent = notice ?? ''; noticeNode.hidden = !notice;
    element('catalog-heading').textContent = selection.mode === 'guided' ? '20 lessons' : '66 examples';
    for (const { item, anchor } of homes) anchor.after(item);
    exportPanel.remove(); sourceInfo.remove();
    if (selection.mode === 'engineering') {
      const source = getExample(selection.exampleId);
      element('example-title').textContent = source.title;
      element('example-question').textContent = source.question;
      element('family-label').textContent = source.group;
      callbacks.renderEngineeringNavigation(query);
      return;
    }
    const lesson = LESSONS.find(l => l.id === selection.lessonId)!;
    const variant = variantFor(selection)!;
    const chapter = CHAPTERS.find(c => c.id === lesson.chapterId)!;
    element('example-title').textContent = lesson.title;
    element('example-question').textContent = lesson.question;
    element('family-label').textContent = chapter.title;
    guide.querySelector<HTMLElement>('[data-testid=lesson-id]')!.textContent = lesson.id;
    previous.disabled = !adjacentLesson(lesson.id, -1);
    next.disabled = !adjacentLesson(lesson.id, 1);
    variantSelect.replaceChildren(...lesson.variants.map((v, index) => {
      const option = node('option', `${index + 1}. ${v.label}`); option.value = v.exampleId; return option;
    }));
    variantSelect.value = variant.exampleId;
    element('variant-position').textContent = `Variant ${lesson.variants.indexOf(variant) + 1} of ${lesson.variants.length}`;
    element('guide-steps').replaceChildren(...variant.steps.map(text => node('li', text)));
    element('guide-expected').textContent = variant.expected;
    element('guide-limitation').textContent = variant.limitation;
    list.replaceChildren();
    const visible = filterLessons(query);
    for (const group of CHAPTERS) {
      const members = visible.filter(l => l.chapterId === group.id);
      if (!members.length) continue;
      const heading = node('p', group.title); heading.className = 'example-group-title'; list.append(heading);
      for (const member of members) {
        const button = node('button'); button.type = 'button';
        button.className = `example-button${member.id === lesson.id ? ' is-active' : ''}`;
        button.dataset.testid = 'lesson-button'; button.dataset.lessonId = member.id;
        if (member.id === lesson.id) button.setAttribute('aria-current', 'page');
        const id = node('span', member.id); id.className = 'id';
        const title = node('span', member.title); title.className = 'label';
        button.append(id, title); list.append(button);
      }
    }
    if (!visible.length) list.append(node('p', 'No lessons match this search.'));
    element('visible-example-count').textContent = String(visible.length);
    for (const [key, item] of Object.entries(utilityNodes)) {
      (variant.controls.utilities.includes(key as UtilityPanel) ? primaryUtilities : technical).append(item);
    }
    technical.prepend(version, sourceInfo);
    sourceInfo.append(badge);
    technical.append(resultCard);
    if (variant.controls.utilities.includes('exports')) {
      const ids = variant.exampleId === 'R03' ? ['export-csv', 'export-json'] : ['export-image'];
      for (const item of exports) if (ids.includes(item.id)) exportActions.append(item);
      primaryUtilities.append(exportPanel);
    }
  }
  function arrangeControls(selection: Selection): void {
    const variant = variantFor(selection);
    if (!variant) return;
    const policy = variant.controls;
    placeInDisclosure(element('common-controls'), item => policy.common.some(key => item.querySelector(`[data-common='${key}']`)), 'Advanced chart settings');
    placeInDisclosure(element('sharing-controls'), item => item.classList.contains('is-fixed') || policy.sharing.some(key => item.querySelector(`[data-sharing-element='${key}']`)), 'Advanced sharing controls');
    placeInDisclosure(element('action-controls'), item => policy.actions.some(key => item.dataset.action === key) || policy.sharing.some(key => item.dataset.mutateElement === key), 'Advanced actions');
  }
  // EXAMPLES remains authoritative; importing the registry never registers new chart types.
  if (EXAMPLES.length === 0) throw new Error('Engineering catalog is empty');
  return { render, arrangeControls };
}

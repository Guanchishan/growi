import type { ITemplate } from '@growi/core/dist/interfaces/template';
import { mock } from 'vitest-mock-extended';

import { useFormatter } from './use-formatter';


const mocks = vi.hoisted(() => {
  return {
    useCurrentPagePathMock: vi.fn(() => { return {} }),
  };
});

vi.mock('~/stores/page', () => {
  return { useCurrentPagePath: mocks.useCurrentPagePathMock };
});


describe('useFormatter', () => {

  describe('format()', () => {

    it('returns an empty string when the argument is undefined', () => {
      // setup
      const mastacheMock = {
        render: vi.fn(),
      };
      vi.doMock('mustache', () => mastacheMock);

      // when
      const { format } = useFormatter();
      // call with undefined
      const markdown = format(undefined);

      // then
      expect(markdown).toBe('');
      expect(mastacheMock.render).not.toHaveBeenCalled();
    });

  });

  it('returns markdown as-is when mustache.render throws an error', () => {
    // setup
    const mastacheMock = {
      render: vi.fn(() => { throw new Error() }),
    };
    vi.doMock('mustache', () => mastacheMock);

    // when
    const { format } = useFormatter();
    const template = mock<ITemplate>();
    template.markdown = 'markdown body';
    const markdown = format(template);

    // then
    expect(markdown).toBe('markdown body');
  });

  it('returns markdown formatted when currentPagePath is undefined', () => {
    // when
    const { format } = useFormatter();
    const template = mock<ITemplate>();
    template.markdown = `
title: {{{title}}}{{^title}}(empty){{/title}}
path: {{{path}}}
`;
    const markdown = format(template);

    // then
    expect(markdown).toBe(`
title: (empty)
path: /
`);
  });

  it('returns markdown formatted', () => {
    // setup
    mocks.useCurrentPagePathMock.mockImplementation(() => {
      return { data: '/Sandbox' };
    });
    // 2023/5/31 15:01:xx
    vi.setSystemTime(new Date(2023, 4, 31, 15, 1));

    // when
    const { format } = useFormatter();
    const template = mock<ITemplate>();
    template.markdown = `
title: {{{title}}}
path: {{{path}}}
date: {{yyyy}}/{{MM}}/{{dd}} {{HH}}:{{mm}}
`;
    const markdown = format(template);

    // then
    expect(markdown).toBe(`
title: Sandbox
path: /Sandbox
date: 2023/05/31 15:01
`);
  });

});

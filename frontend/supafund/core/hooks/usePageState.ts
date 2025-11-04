import { useCallback, useContext } from 'react';

import { PageStateContext } from '@/supafund/core/providers/PageStateProvider';
import { Pages } from '@/supafund/core/enums/Pages';

export const usePageState = () => {
  const pageState = useContext(PageStateContext);

  const goto = useCallback(
    (state: Pages) => {
      pageState.setPageState(state);
    },
    [pageState],
  );

  return { goto, ...pageState };
};

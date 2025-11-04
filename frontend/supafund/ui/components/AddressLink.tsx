import { ReactNode } from 'react';

import { SupportedMiddlewareChain } from '@/supafund/core/constants/chains';
import { UNICODE_SYMBOLS } from '@/supafund/core/constants/symbols';
import { EXPLORER_URL_BY_MIDDLEWARE_CHAIN } from '@/supafund/core/constants/urls';
import { Address } from '@/supafund/core/types/Address';
import { truncateAddress } from '@/supafund/core/utils/truncate';

type AddressLinkProps = {
  address: Address;
  middlewareChain: SupportedMiddlewareChain;
  prefix?: ReactNode;
  hideLinkArrow?: boolean;
};

export const AddressLink = ({
  address,
  hideLinkArrow = false,
  prefix,
  middlewareChain,
}: AddressLinkProps) => {
  if (!address) return null;
  if (!middlewareChain) return null;

  return (
    <a
      target="_blank"
      href={`${EXPLORER_URL_BY_MIDDLEWARE_CHAIN[middlewareChain]}/address/${address}`}
    >
      {prefix ? (
        <>
          &nbsp;
          {prefix}
        </>
      ) : (
        truncateAddress(address)
      )}

      {hideLinkArrow ? null : (
        <>
          &nbsp;
          {UNICODE_SYMBOLS.EXTERNAL_LINK}
        </>
      )}
    </a>
  );
};

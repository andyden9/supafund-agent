import { NA } from '@/supafund/core/constants/symbols';
import { Address } from '@/supafund/core/types/Address';

export const truncateAddress = (address: Address, length = 4) =>
  typeof address === 'string'
    ? `${address?.substring(0, 2 + length)}...${address?.substring(address.length - length, address.length)}`
    : NA;

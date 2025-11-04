import { useContext } from 'react';

import { ModalContext } from '@/supafund/core/providers/ModalProvider';

export const useModals = () => {
  const { migrationModalOpen, setMigrationModalOpen } =
    useContext(ModalContext);

  return {
    migrationModalOpen,
    setMigrationModalOpen,
  };
};

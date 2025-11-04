import { Form, FormInstance } from 'antd';
import { noop } from 'lodash';
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useCallback,
  useState,
} from 'react';

import { ServiceTemplate } from '@/supafund/core/client';
import { Pages } from '@/supafund/core/enums/Pages';
import { usePageState } from '@/supafund/core/hooks/usePageState';
import { useServices } from '@/supafund/core/hooks/useServices';
import { ServicesService } from '@/supafund/core/services/Services';
import { DeepPartial } from '@/supafund/core/types/Util';

import { useConfirmUpdateModal } from '@/supafund/ui/components/UpdateAgentPage/hooks/useConfirmModal';
import {
  defaultModalProps,
  ModalProps,
} from '@/supafund/ui/components/UpdateAgentPage/hooks/useModal';
import { useUnsavedModal } from '@/supafund/ui/components/UpdateAgentPage/hooks/useUnsavedModal';
import { ConfirmUpdateModal } from '@/supafund/ui/components/UpdateAgentPage/modals/ConfirmUpdateModal';
import { UnsavedModal } from '@/supafund/ui/components/UpdateAgentPage/modals/UnsavedModal';

export const UpdateAgentContext = createContext<{
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  form?: FormInstance;
  confirmUpdateModal: ModalProps;
  unsavedModal: ModalProps;
}>({
  isEditing: false,
  setIsEditing: noop,
  unsavedModal: defaultModalProps,
  confirmUpdateModal: defaultModalProps,
});

export const UpdateAgentProvider = ({ children }: PropsWithChildren) => {
  const [form] = Form.useForm<DeepPartial<ServiceTemplate>>(); // TODO: wrong type, fix it
  const { refetch: refetchServices, selectedService } = useServices();
  const { goto } = usePageState();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Save button loading state

  const confirmUpdateCallback = useCallback(async () => {
    const formValues = form.getFieldsValue();

    if (!selectedService || !selectedService.service_config_id) return;

    setIsSaving(true);

    const envVariables = (formValues?.env_variables ||
      {}) as ServiceTemplate['env_variables'];

    const partialServiceTemplate = {
      serviceConfigId: selectedService.service_config_id,
      partialServiceTemplate: {
        ...formValues,
        env_variables: {
          ...Object.entries(envVariables).reduce(
            (acc, [key, value]) => ({
              ...acc,
              [key]: {
                // Pass the environment variable details
                // in case the variable doesn't exist yet in the service
                value, // Update with the value from the form
              },
            }),
            {},
          ),
        },
      },
    };

    try {
      await ServicesService.updateService(partialServiceTemplate);
      await refetchServices?.();
    } catch (error) {
      console.error(error);
    } finally {
      setIsEditing(false);
      setIsSaving(false);
    }
  }, [form, selectedService, refetchServices]);

  const confirmUnsavedCallback = useCallback(async () => {
    goto(Pages.Main);
  }, [goto]);

  const confirmUpdateModal = useConfirmUpdateModal({
    confirmCallback: confirmUpdateCallback,
  });

  const unsavedModal = useUnsavedModal({
    confirmCallback: confirmUnsavedCallback,
  });

  return (
    <UpdateAgentContext.Provider
      value={{
        confirmUpdateModal,
        unsavedModal,
        form,
        isEditing,
        setIsEditing,
      }}
    >
      <ConfirmUpdateModal isLoading={isSaving} />
      <UnsavedModal />
      {children}
    </UpdateAgentContext.Provider>
  );
};

import React, { useEffect, useState, useRef } from 'react';
import { useWorkplace } from '@/context/WorkplaceContext';
import { Account, AccountType, ApiResponse } from '@/lib/types'; 
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import EntityDialog from '@/components/ui/entity-dialog';
import useFormState, { ValidationRules } from '@/hooks/useFormState'; 
import FormField from '@/components/ui/form-field'; 
import FormSelect from '@/components/ui/form-select'; 
import { AccountRequest } from '@/services/accountService';
import { useFetchCurrencies } from '@/hooks/queries/useFetchCurrencies';
import { useFetchAccounts } from '@/hooks/queries/useFetchAccounts';
import { useCreateAccount } from '@/hooks/mutations/useCreateAccount';
import { useUpdateAccount } from '@/hooks/mutations/useUpdateAccount';

interface AccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (account: Account) => void;
  initialData?: Account;
}

const AccountDialog: React.FC<AccountDialogProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialData
}) => {
  const { state: workplaceState } = useWorkplace();
  const selectedWorkplace = workplaceState.selectedWorkplace;
  const workplaceId = selectedWorkplace?.workplaceID || '';

  const { 
    data: allCurrencies, 
    isLoading: isLoadingCurrencies, 
    error: currenciesError 
  } = useFetchCurrencies(); 

  const { 
    data: fetchAccountsResponse,
    isLoading: isLoadingParentAccounts,
    error: parentAccountsError,
  } = useFetchAccounts(
    workplaceId, 
    { enabled: isOpen && !!workplaceId } 
  );
  const allAccountsForDropdown = fetchAccountsResponse || []; 
  
  const parentAccountOptions = allAccountsForDropdown
    .filter(acc => !initialData || acc.accountID !== initialData.accountID) 
    .map(acc => ({ label: acc.name, value: acc.accountID }));
  
  const isEditMode = !!initialData;
  const wasOpenRef = useRef(false);
  const initialDataRef = useRef(initialData);

  const initialValues: AccountRequest = {
    name: initialData?.name || '',
    accountType: initialData?.accountType || AccountType.ASSET, 
    currencyCode: initialData?.currencyCode || selectedWorkplace?.defaultCurrencyCode || '',
    cfid: initialData?.cfid || '',
    description: initialData?.description || '',
    parentAccountID: (initialData as any)?.parentAccountID || null, 
    isActive: initialData?.isActive === undefined ? true : initialData.isActive,
  };

  const validationRules: ValidationRules<AccountRequest> = {
    name: [{ validate: (value: string) => !!value?.trim(), message: 'Account name is required.' }],
    accountType: [{ validate: (value: AccountType) => !!value, message: 'Account type is required.' }],
    currencyCode: [{ validate: (value: string) => !!value, message: 'Currency is required.' }],
  } as any; 

  const createAccountMutation = useCreateAccount(workplaceId, {
    onSuccess: (newAccount) => {
      onSaved(newAccount);
      onClose(); 
    },
  });
  const updateAccountMutation = useUpdateAccount(workplaceId, {
    onSuccess: (updatedAccount) => {
      onSaved(updatedAccount);
      onClose();
    },
  });

  const actualSubmitFunction = async (formData: AccountRequest) => {
    if (isEditMode && initialData) {
      await updateAccountMutation.mutateAsync({ accountId: initialData.accountID, accountData: formData });
    } else {
      await createAccountMutation.mutateAsync(formData);
    }
  };

  const formState = useFormState<AccountRequest>(
    initialValues,
    validationRules,
    actualSubmitFunction
  );
  
  const { reset, handleSubmit, errors, values, handleChange, handleSelectChange, handleCheckboxChange, isSubmitting, isDirty } = formState;
  
  const isPageLoading = isLoadingCurrencies || isLoadingParentAccounts || workplaceState.isLoading;

  useEffect(() => {
    const isOpeningDialog = isOpen && !wasOpenRef.current;
    const isDataChanged = isOpen && initialData !== initialDataRef.current;

    if (isOpeningDialog || isDataChanged) {
      reset(initialValues); 
      initialDataRef.current = initialData;
    }
    
    wasOpenRef.current = isOpen;
  }, [isOpen, initialData, initialValues, reset]);

  if (!isOpen) return null;

  if (isPageLoading && !allCurrencies && !fetchAccountsResponse) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{initialData ? 'Edit Account' : 'Create New Account'}</DialogTitle>
          </DialogHeader>
          <p>Loading essential data...</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (currenciesError || parentAccountsError) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <p>{currenciesError?.message || parentAccountsError?.message || 'Failed to load data for the form.'}</p>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <EntityDialog
      title={initialData ? "Edit Account" : "Create Account"}
      description="Enter the account details below"
      isEditMode={isEditMode}
      isSubmitting={isSubmitting || createAccountMutation.isPending || updateAccountMutation.isPending}
      formError={errors.form} 
      isDirty={isDirty}
      onSubmit={handleSubmit} 
      onClose={onClose}
      isOpen={isOpen}
    >
      <FormField
        id="name"
        name="name"
        label="Account Name"
        value={values.name}
        error={errors.name}
        onChange={handleChange}
        required
      />
      <FormSelect
        id="accountType"
        name="accountType"
        label="Account Type"
        value={values.accountType}
        error={errors.accountType}
        onChange={(value) => handleSelectChange('accountType', value)}
        required
        options={Object.values(AccountType).map(type => ({ label: type, value: type }))}
      />
      <FormSelect 
        id="currencyCode"
        name="currencyCode" 
        label="Currency" 
        value={values.currencyCode}
        error={errors.currencyCode}
        onChange={(value) => handleSelectChange('currencyCode', value)}
        required
        disabled={isLoadingCurrencies}
        options={allCurrencies ? allCurrencies
          .filter(currency => currency.currencyCode && currency.currencyCode.trim() !== '') 
          .map(c => ({ label: `${c.currencyCode} (${c.name})`, value: c.currencyCode })) : []}
      />
      <FormField
        id="cfid"
        name="cfid"
        label="Customer Facing ID (Optional)"
        value={values.cfid || ''}
        error={errors.cfid}
        onChange={handleChange}
        placeholder="e.g., CUST-123"
      />
      <FormField 
        id="description" 
        name="description" 
        label="Description (Optional)" 
        value={values.description || ''}
        error={errors.description}
        onChange={handleChange}
        type="textarea" 
      />
      <FormSelect 
        id="parentAccountID"
        name="parentAccountID" 
        label="Parent Account (Optional)" 
        value={values.parentAccountID || 'none'} 
        error={errors.parentAccountID}
        onChange={(value) => handleSelectChange('parentAccountID', value === 'none' ? null : value)}
        options={[{label: 'None', value: 'none'}, ...parentAccountOptions]}
        placeholder="Select a parent account"
      />
      <div className="flex items-center space-x-2 mt-4">
        <Switch
          id="isActive"
          checked={values.isActive}
          onCheckedChange={(checked) => handleCheckboxChange('isActive', checked) }
        />
        <label htmlFor="isActive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Active
        </label>
      </div>
    </EntityDialog>
  );
};

export default AccountDialog;
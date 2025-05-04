import React, { useEffect, useState, useRef } from 'react';
import { useWorkplace } from '@/context/WorkplaceContext';
import { Account, AccountType } from '@/lib/types';
import apiService from '@/services/apiService';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// Import our new reusable components and hooks
import EntityDialog from '@/components/ui/entity-dialog';
import useFormState, { ValidationRules } from '@/hooks/useFormState';
import FormField from '@/components/ui/form-field';
import FormSelect from '@/components/ui/form-select';
import { useFormSubmission } from '@/lib/form-submission';
import accountService, { AccountRequest } from '@/services/accountService';
import useApiResource from '@/hooks/useApiResource';
import { useCurrency } from '@/context/CurrencyContext';

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
  const { state: currencyState } = useCurrency();
  const workplaceId = workplaceState.selectedWorkplace?.workplaceID || '';
  const isEditMode = !!initialData;
  
  // Track whether dialog has been opened
  const wasOpenRef = useRef(false);
  const initialDataRef = useRef(initialData);
  
  // Use currencies from the context instead of making a separate API call
  const currencies = currencyState.currencies.length > 0
    ? currencyState.currencies
    : [
        { currencyCode: 'USD', name: 'US Dollar' },
        { currencyCode: 'EUR', name: 'Euro' },
        { currencyCode: 'GBP', name: 'British Pound' },
        { currencyCode: 'INR', name: 'Indian Rupee' }
      ];
  
  // Fetch parent accounts if workplace is selected
  const { data: accountsData } = useApiResource<{ accounts: Account[] }>(
    workplaceId ? `/workplaces/${workplaceId}/accounts` : '',
    {},
    {
      fetchOnMount: isOpen && !!workplaceId,
    }
  );
  
  // Filter out the current account if in edit mode
  const parentAccounts = accountsData?.accounts
    ? (initialData
        ? accountsData.accounts.filter(account => account.accountID !== initialData.accountID)
        : accountsData.accounts)
    : [];
  
  // Setup initial form values
  const initialValues: AccountRequest = {
    name: initialData?.name || '',
    accountType: initialData?.accountType || AccountType.ASSET,
    currencyCode: initialData?.currencyCode || 'USD',
    description: initialData?.description || '',
    parentAccountID: (initialData as any)?.parentAccountID || null,
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true
  };
  
  // Validation rules
  const validationRules: ValidationRules<AccountRequest> = {
    name: [{ validate: value => !!value.trim(), message: 'Account name is required' }],
    accountType: [{ validate: value => !!value, message: 'Account type is required' }],
    currencyCode: [{ validate: value => !!value, message: 'Currency is required' }]
  };
  
  // Setup form submission handler
  const { handleSubmit } = useFormSubmission();
  const submitAccount = handleSubmit({
    apiFunction: (data: AccountRequest) => {
      if (!workplaceId) {
        return Promise.resolve({ error: 'No workplace selected' });
      }
      
      return initialData
        ? accountService.updateAccount(workplaceId, initialData.accountID, data)
        : accountService.createAccount(workplaceId, data);
    },
    onSuccess: (account) => {
      onSaved(account);
      onClose();
    },
    successMessage: initialData 
      ? 'Account updated successfully' 
      : 'Account created successfully',
    errorMessagePrefix: initialData
      ? 'Failed to update account'
      : 'Failed to create account',
  });
  
  // Use our custom form state hook
  const formState = useFormState<AccountRequest>(
    initialValues,
    validationRules,
    submitAccount
  );
  
  // Only reset when dialog is newly opened or initialData changes
  useEffect(() => {
    // Only reset the form when the dialog changes from closed to open
    // or when the initialData changes while open
    const isOpeningDialog = isOpen && !wasOpenRef.current;
    const isDataChanged = isOpen && initialData !== initialDataRef.current;
    
    if (isOpeningDialog || isDataChanged) {
      formState.reset(initialValues);
      initialDataRef.current = initialData;
    }
    
    // Track dialog open state
    wasOpenRef.current = isOpen;
  }, [isOpen, initialData, initialValues, formState.reset]);
  
  return (
    <EntityDialog
      title={initialData ? "Edit Account" : "Create Account"}
      description="Enter the account details below"
      isEditMode={isEditMode}
      isSubmitting={formState.isSubmitting}
      formError={formState.errors.form}
      isDirty={formState.isDirty}
      onSubmit={formState.handleSubmit}
      onClose={onClose}
      isOpen={isOpen}
    >
      <FormField
        id="name"
        name="name"
        label="Account Name"
        value={formState.values.name}
        error={formState.errors.name}
        onChange={formState.handleChange}
        required
      />
      
      <FormSelect
        id="accountType"
        name="accountType"
        label="Account Type"
        value={formState.values.accountType}
        error={formState.errors.accountType}
        onChange={(value) => formState.handleSelectChange('accountType', value)}
        required
        options={Object.values(AccountType).map(type => ({
          value: type,
          label: type
        }))}
      />
      
      <FormSelect
        id="currencyCode"
        name="currencyCode"
        label="Currency"
        value={formState.values.currencyCode}
        error={formState.errors.currencyCode}
        onChange={(value) => formState.handleSelectChange('currencyCode', value)}
        required
        options={currencies.map(currency => ({
          value: currency.currencyCode,
          label: `${currency.name} (${currency.currencyCode})`
        }))}
      />
      
      <FormSelect
        id="parentAccountID"
        name="parentAccountID"
        label="Parent Account"
        value={formState.values.parentAccountID || 'none'}
        onChange={(value) => formState.handleSelectChange('parentAccountID', value === 'none' ? null : value)}
        options={[
          { value: 'none', label: 'None' },
          ...parentAccounts.map(account => ({
            value: account.accountID,
            label: account.name
          }))
        ]}
      />
      
      <FormField
        id="description"
        name="description"
        label="Description"
        value={formState.values.description || ''}
        onChange={formState.handleChange}
        type="textarea"
      />
      
      {isEditMode && (
        <div className="flex items-center space-x-2 pt-4">
          <Switch
            id="isActive"
            checked={formState.values.isActive}
            onCheckedChange={(checked) => 
              formState.handleCheckboxChange('isActive', checked)
            }
          />
          <label 
            htmlFor="isActive" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Active
          </label>
        </div>
      )}
    </EntityDialog>
  );
};

export default AccountDialog; 
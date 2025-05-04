import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWorkplace } from '@/context/WorkplaceContext';
import { Account, AccountType } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import apiService from '@/services/apiService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface AccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (account: Account) => void;
  initialData?: Account;
}

interface AccountRequest {
  name: string;
  accountType: AccountType;
  currencyCode: string;
  description?: string;
  parentAccountID?: string;
  isActive?: boolean;
}

const AccountDialog: React.FC<AccountDialogProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialData
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [formData, setFormData] = useState<AccountRequest>({
    name: '',
    accountType: AccountType.ASSET,
    currencyCode: 'USD',
    description: '',
    parentAccountID: 'none',
    isActive: true
  });
  const [currencies, setCurrencies] = useState<{currencyCode: string; name: string}[]>([]);
  const [parentAccounts, setParentAccounts] = useState<Account[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { state: workplaceState } = useWorkplace();
  const { toast } = useToast();
  
  // Initialize form with initial data if provided (editing mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        accountType: initialData.accountType,
        currencyCode: initialData.currencyCode,
        description: initialData.description || '',
        parentAccountID: (initialData as any).parentAccountID || 'none',
        isActive: initialData.isActive !== undefined ? initialData.isActive : true
      });
    } else {
      // Reset to defaults for creation mode
      setFormData({
        name: '',
        accountType: AccountType.ASSET,
        currencyCode: 'USD',
        description: '',
        parentAccountID: 'none',
        isActive: true
      });
    }
  }, [initialData, isOpen]);
  
  // Fetch currencies and accounts when dialog opens
  useEffect(() => {
    const fetchCurrencies = async () => {
      if (!workplaceState.selectedWorkplace) return;
      
      setIsLoadingCurrencies(true);
      try {
        const response = await apiService.get<{ currencies: {currencyCode: string; name: string}[] } | {currencyCode: string; name: string}[]>('/currencies');
        
        // Handle different response formats
        let currenciesData: {currencyCode: string; name: string}[] = [];
        
        if (response.data) {
          console.log('Currency API response:', response.data);
          
          if (Array.isArray(response.data)) {
            // Direct array of currencies
            currenciesData = response.data;
          } else if (response.data.currencies && Array.isArray(response.data.currencies)) {
            // Wrapped in currencies property
            currenciesData = response.data.currencies;
          }
          
          console.log('Processed currencies:', currenciesData);
          
          if (currenciesData.length > 0) {
            setCurrencies(currenciesData);
            if (!initialData) {
              setFormData(prev => ({
                ...prev,
                currencyCode: currenciesData[0].currencyCode
              }));
            }
          } else {
            // Fallback to default currencies if none returned
            const fallbackCurrencies = [
              { currencyCode: 'USD', name: 'US Dollar' },
              { currencyCode: 'EUR', name: 'Euro' },
              { currencyCode: 'GBP', name: 'British Pound' },
              { currencyCode: 'INR', name: 'Indian Rupee' }
            ];
            setCurrencies(fallbackCurrencies);
            if (!initialData) {
              setFormData(prev => ({
                ...prev,
                currencyCode: 'USD'
              }));
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch currencies:', error);
        // Use fallback currencies on error
        const fallbackCurrencies = [
          { currencyCode: 'USD', name: 'US Dollar' },
          { currencyCode: 'EUR', name: 'Euro' },
          { currencyCode: 'GBP', name: 'British Pound' },
          { currencyCode: 'INR', name: 'Indian Rupee' }
        ];
        setCurrencies(fallbackCurrencies);
      } finally {
        setIsLoadingCurrencies(false);
      }
    };
    
    const fetchAccounts = async () => {
      if (!workplaceState.selectedWorkplace) return;
      
      setIsLoadingAccounts(true);
      try {
        const response = await apiService.get<{ accounts: Account[] }>(
          `/workplaces/${workplaceState.selectedWorkplace.workplaceID}/accounts`
        );
        if (response.data && Array.isArray(response.data.accounts)) {
          // Filter out the current account if in edit mode
          const filteredAccounts = initialData ? 
            response.data.accounts.filter(account => account.accountID !== initialData.accountID) : 
            response.data.accounts;
          
          setParentAccounts(filteredAccounts);
        }
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      } finally {
        setIsLoadingAccounts(false);
      }
    };
    
    if (isOpen) {
      fetchCurrencies();
      fetchAccounts();
    }
  }, [isOpen, workplaceState.selectedWorkplace, initialData]);
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }
    
    if (!formData.accountType) {
      newErrors.accountType = 'Account type is required';
    }
    
    if (!formData.currencyCode) {
      newErrors.currencyCode = 'Currency is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!workplaceState.selectedWorkplace) {
      toast({
        title: "Error",
        description: "No workplace selected",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Prepare the request payload
      const payload: AccountRequest = {
        name: formData.name,
        accountType: formData.accountType,
        currencyCode: formData.currencyCode,
        isActive: formData.isActive
      };
      
      // Only add optional fields if they have values
      if (formData.description && formData.description.trim()) {
        payload.description = formData.description;
      }
      
      // Only add parentAccountID if it's not "none" and has a value
      if (formData.parentAccountID && formData.parentAccountID !== "none" && formData.parentAccountID.trim()) {
        payload.parentAccountID = formData.parentAccountID;
      }
      
      const isUpdate = !!initialData;
      const endpoint = isUpdate
        ? `/workplaces/${workplaceState.selectedWorkplace.workplaceID}/accounts/${initialData.accountID}`
        : `/workplaces/${workplaceState.selectedWorkplace.workplaceID}/accounts`;
      
      const method = isUpdate ? 'put' : 'post';
      
      const response = await apiService[method]<Account>(endpoint, payload);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        toast({
          title: "Success",
          description: isUpdate ? "Account updated successfully" : "Account created successfully"
        });
        
        onSaved(response.data);
        onClose();
      }
    } catch (error: any) {
      console.error('Error saving account:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${initialData ? 'update' : 'create'} account`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit' : 'Create New'} Account</DialogTitle>
          <DialogDescription>
            Enter the details for the {initialData ? 'account' : 'new account'}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Cash, Accounts Receivable"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accountType">Account Type *</Label>
            <Select 
              value={formData.accountType} 
              onValueChange={(value) => handleSelectChange("accountType", value)}
              disabled={!!initialData} // Can't change account type when editing
            >
              <SelectTrigger className={errors.accountType ? "border-red-500" : ""}>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AccountType.ASSET}>Asset</SelectItem>
                <SelectItem value={AccountType.LIABILITY}>Liability</SelectItem>
                <SelectItem value={AccountType.EQUITY}>Equity</SelectItem>
                <SelectItem value={AccountType.REVENUE}>Revenue</SelectItem>
                <SelectItem value={AccountType.EXPENSE}>Expense</SelectItem>
              </SelectContent>
            </Select>
            {errors.accountType && <p className="text-xs text-red-500">{errors.accountType}</p>}
            {initialData && (
              <p className="text-xs text-muted-foreground">Account type cannot be changed after creation.</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currencyCode">Currency *</Label>
            <Select 
              value={formData.currencyCode} 
              onValueChange={(value) => handleSelectChange("currencyCode", value)}
              disabled={(isLoadingCurrencies || currencies.length === 0) || !!initialData} // Can't change currency when editing
            >
              <SelectTrigger className={errors.currencyCode ? "border-red-500" : ""}>
                <SelectValue placeholder={isLoadingCurrencies ? "Loading currencies..." : "Select currency"} />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(currency => (
                  <SelectItem key={currency.currencyCode} value={currency.currencyCode}>
                    {currency.currencyCode} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.currencyCode && <p className="text-xs text-red-500">{errors.currencyCode}</p>}
            {initialData && (
              <p className="text-xs text-muted-foreground">Currency cannot be changed after creation.</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Optional description for this account"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="parentAccountID">Parent Account</Label>
            <Select 
              value={formData.parentAccountID} 
              onValueChange={(value) => handleSelectChange("parentAccountID", value)}
              disabled={isLoadingAccounts}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingAccounts ? "Loading accounts..." : "Select parent account (optional)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {parentAccounts.map(account => (
                  <SelectItem key={account.accountID} value={account.accountID}>
                    {account.name} ({account.accountType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {initialData && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleCheckboxChange("isActive", e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isActive" className="cursor-pointer">Active Account</Label>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  {initialData ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                initialData ? 'Update Account' : 'Create Account'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AccountDialog; 
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JournalWithTransactions, Transaction, TransactionType, Account } from '@/lib/types';
import { Trash2, Plus, Loader2, Save } from 'lucide-react';
import apiService from '@/services/apiService';
import { useWorkplace } from '@/context/WorkplaceContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface JournalFormProps {
  onSave: (journal: JournalWithTransactions) => void;
  onCancel: () => void;
  initialData?: JournalWithTransactions;
  isSaving?: boolean;
}

// Helper to create a default transaction (use notes, amount as string)
const createDefaultTransaction = (type: TransactionType, date: string): Omit<Transaction, 'transactionID' | 'journalID' | 'createdBy' | 'currencyCode'> => ({
  accountID: '', 
  amount: '0', 
  transactionType: type,
  notes: '', 
  createdAt: date, 
});

const JournalForm: React.FC<JournalFormProps> = ({ onSave, onCancel, initialData, isSaving = false }) => {
  const { state: workplaceState } = useWorkplace();
  const currentWorkplaceId = initialData?.workplaceID || workplaceState.selectedWorkplace?.workplaceID;

  const [formData, setFormData] = useState<JournalWithTransactions>(() => {
    const today = new Date().toISOString().split('T')[0];
    const initialDebit = createDefaultTransaction(TransactionType.DEBIT, today);
    const initialCredit = createDefaultTransaction(TransactionType.CREDIT, today);
    
    // Initialize currencyCode from initialData or leave empty
    const initialCurrency = initialData?.currencyCode || ''; 

    return (
      initialData || {
        journalID: '',
        workplaceID: currentWorkplaceId || '',
        date: today,
        description: '',
        currencyCode: initialCurrency, // Use initial or empty
        createdAt: today,
        createdBy: '',
        lastUpdatedAt: today,
        lastUpdatedBy: '',
        transactions: [
           { ...initialDebit, transactionID: `temp-${Date.now()}-1`, journalID: '' } as unknown as Transaction,
           { ...initialCredit, transactionID: `temp-${Date.now()}-2`, journalID: '' } as unknown as Transaction,
        ].map(t => ({...t, currencyCode: initialCurrency })), // Ensure initial transactions match currency
      }
    );
  });
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState<boolean>(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  const [errors, setErrors] = useState<{
    date?: string;
    transactions?: string;
    balance?: string;
    general?: string;
  }>({});
  
  useEffect(() => {
    if (!currentWorkplaceId) {
      setAccountsLoading(false);
      setAccountsError('No workplace selected. Cannot load accounts.');
      setErrors(prev => ({...prev, general: 'No workplace selected.'}));
      return;
    }
    
    setAccountsLoading(true);
    setAccountsError(null);
    setErrors(prev => ({...prev, general: undefined}));
    
    const fetchAccounts = async () => {
      const response = await apiService.get<{ accounts: Account[] }>(`/workplaces/${currentWorkplaceId}/accounts`);
      if (response.data && response.data.accounts) {
        setAccounts(response.data.accounts);
      } else {
        setAccountsError(response.error || 'Failed to load accounts.');
      }
      setAccountsLoading(false);
    };
    
    fetchAccounts();
    if (!formData.workplaceID) {
        setFormData(prev => ({ ...prev, workplaceID: currentWorkplaceId! }));
    }

  }, [currentWorkplaceId]);

  useEffect(() => {
     if (currentWorkplaceId && formData.workplaceID !== currentWorkplaceId) {
       setFormData(prev => ({ ...prev, workplaceID: currentWorkplaceId }));
     }
  }, [currentWorkplaceId, formData.workplaceID]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
      ...(name === 'date' && { 
        transactions: formData.transactions.map(t => ({...t, createdAt: value}))
      })
    });
    
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };
  
  const handleTransactionChange = (index: number, field: keyof Transaction, value: any) => {
    // Declare with let at the top
    let updatedTransactions = [...formData.transactions]; 
    const fieldName = field as keyof Transaction;
    let updatedFormData = { ...formData };

    updatedTransactions[index] = {
      ...updatedTransactions[index],
      [fieldName]: value,
      createdAt: formData.date, 
    };

    // If account is changed, determine the journal currency
    if (fieldName === 'accountID' && value) {
      const selectedAccount = accounts.find(acc => acc.accountID === value);
      if (selectedAccount) {
        // If journal currency is not set yet, set it based on this first account
        if (!updatedFormData.currencyCode) {
          updatedFormData.currencyCode = selectedAccount.currencyCode;
          // Also update all existing transaction currency codes to match
          updatedTransactions = updatedTransactions.map(t => ({
             ...t, 
             currencyCode: selectedAccount.currencyCode 
          }));
        }
        // Update the current transaction's currency code specifically
        updatedTransactions[index].currencyCode = selectedAccount.currencyCode;
        
        // Add validation later to ensure consistency if currencyCode is already set
      }
    }

    setFormData({
      ...updatedFormData,
      transactions: updatedTransactions,
    });
    
    if (errors.balance || errors.transactions) {
      setErrors({
        ...errors,
        balance: undefined,
        transactions: undefined,
      });
    }
  };
  
  const addTransaction = () => {
    if (accountsLoading || accountsError || accounts.length === 0) return;
    setFormData({
      ...formData,
      transactions: [
        ...formData.transactions,
        // Adapt to match Transaction structure (needs transactionID etc)
        { 
          ...createDefaultTransaction(TransactionType.DEBIT, formData.date), 
          transactionID: `temp-${Date.now()}-${formData.transactions.length + 1}`, 
          journalID: formData.journalID // Use current journal ID if available
        } as Transaction,
      ],
    });
  };
  
  const removeTransaction = (index: number) => {
    if (formData.transactions.length <= 2) {
      setErrors({
        ...errors,
        transactions: 'A journal must have at least two transactions',
      });
      return;
    }
    
    // Use const here as it's scoped to this function and not reassigned before splice
    const updatedTransactions = [...formData.transactions];
    updatedTransactions.splice(index, 1);
    
    setFormData({
      ...formData,
      transactions: updatedTransactions,
    });
    
    if (errors.balance || errors.transactions) {
      setErrors({
        ...errors,
        balance: undefined,
        transactions: undefined,
      });
    }
  };
  
  const isJournalBalanced = (): boolean => {
    const debits = formData.transactions
      .filter(t => t.transactionType === TransactionType.DEBIT)
      .reduce((sum, t) => sum + Number(t.amount || '0'), 0); // Use Number(), provide default
    
    const credits = formData.transactions
      .filter(t => t.transactionType === TransactionType.CREDIT)
      .reduce((sum, t) => sum + Number(t.amount || '0'), 0); // Use Number(), provide default
    
    return Math.abs(debits - credits) < 0.01;
  };
  
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!currentWorkplaceId) {
      newErrors.general = 'No workplace selected.';
    }    
    if (!formData.date) {
      newErrors.date = 'Journal date is required';
    }
    
    if (formData.transactions.length < 2) {
      newErrors.transactions = 'A journal must have at least two transactions';
    }
    
    const invalidTransactions = formData.transactions.some(
      t => !t.accountID || !t.amount || Number(t.amount) <= 0 
    );
    
    if (invalidTransactions && !newErrors.transactions) {
      newErrors.transactions = 'All transactions must have an account and a valid amount greater than zero';
    }
    
    if (!isJournalBalanced()) {
      newErrors.balance = 'Journal must be balanced (debits must equal credits)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workplaceID) {
        setErrors(prev => ({...prev, general: 'Workplace ID is missing.'}));
        return;
    }
    if (validateForm()) {
      onSave(formData); 
    }
  };
  
  const debitTotal = formData.transactions
    .filter(t => t.transactionType === TransactionType.DEBIT)
    .reduce((sum, t) => sum + Number(t.amount || '0'), 0);
  
  const creditTotal = formData.transactions
    .filter(t => t.transactionType === TransactionType.CREDIT)
    .reduce((sum, t) => sum + Number(t.amount || '0'), 0);
  
  const formDisabled = accountsLoading || !!accountsError || !currentWorkplaceId || isSaving;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit' : 'Create'} Journal {initialData?.description || ''}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {accountsLoading && (
             <div className="flex items-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading accounts...
             </div>
           )}
           {accountsError && (
             <Alert variant="destructive">
               <AlertDescription>{accountsError}</AlertDescription>
             </Alert>
           )}
           {errors.general && (
             <Alert variant="destructive">
               <AlertDescription>{errors.general}</AlertDescription>
             </Alert>
           )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date.split('T')[0]}
                onChange={handleChange}
                required
                disabled={formDisabled}
              />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={2}
              disabled={formDisabled}
              className="resize-none"
              placeholder="Enter journal description..."
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Transactions</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addTransaction}
                disabled={formDisabled}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Transaction
              </Button>
            </div>
            
            {errors.transactions && (
              <p className="text-sm text-red-500">{errors.transactions}</p>
            )}
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.transactions.map((transaction, index) => (
                    <TableRow key={transaction.transactionID}>
                      <TableCell className="py-2">
                        <Select 
                          value={transaction.accountID}
                          onValueChange={(value) => handleTransactionChange(index, 'accountID', value)}
                          disabled={formDisabled}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map(account => (
                              <SelectItem key={account.accountID} value={account.accountID}>
                                {account.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-2">
                        <Input
                          type="text"
                          placeholder="Notes (optional)"
                          value={transaction.notes || ''}
                          onChange={(e) => handleTransactionChange(index, 'notes', e.target.value)}
                          className="h-9"
                          disabled={formDisabled}
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <Select
                          value={transaction.transactionType}
                          onValueChange={(value) => handleTransactionChange(index, 'transactionType', value)}
                          disabled={formDisabled}
                        >
                          <SelectTrigger className="w-[100px] h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={TransactionType.DEBIT}>Debit</SelectItem>
                            <SelectItem value={TransactionType.CREDIT}>Credit</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={transaction.amount}
                          onChange={(e) => handleTransactionChange(index, 'amount', e.target.value)}
                          required
                          step="0.01"
                          className="text-right h-9"
                          disabled={formDisabled}
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeTransaction(index)}
                          disabled={formData.transactions.length <= 2 || formDisabled}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-4 border-t pt-3">
                <div className="flex justify-end">
                  <div className="w-1/2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Debits:</span>
                      <span className="font-medium">${debitTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-medium">Total Credits:</span>
                      <span className="font-medium">${creditTotal.toFixed(2)}</span>
                    </div>
                    <div className={`flex justify-between items-center mt-2 pt-2 border-t ${
                      isJournalBalanced() ? 'text-green-600' : 'text-red-500'
                    }`}>
                      <span className="font-bold">Balance:</span>
                      <span className="font-bold">${(debitTotal - creditTotal).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {errors.balance && (
                <p className="text-sm text-red-500 text-center mt-2">{errors.balance}</p>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-2 border-t pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={formDisabled}
            className="flex items-center"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Journal
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default JournalForm;

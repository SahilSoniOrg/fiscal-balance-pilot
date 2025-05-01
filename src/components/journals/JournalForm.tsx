import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JournalWithTransactions, Transaction, TransactionType, Account, Journal } from '@/lib/types';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import apiService from '@/services/apiService';
import { useWorkplace } from '@/context/WorkplaceContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface JournalFormProps {
  onSave: (journal: JournalWithTransactions) => void;
  onCancel: () => void;
  initialData?: JournalWithTransactions;
}

// Helper to create a default transaction (use notes, amount as string)
const createDefaultTransaction = (type: TransactionType, date: string): Omit<Transaction, 'transactionID' | 'journalID' | 'createdBy'> => ({
  accountID: '', // Use correct ID casing
  amount: '0', // Default amount as string
  transactionType: type,
  currencyCode: 'USD', 
  notes: '', // Use notes field
  createdAt: date, // Use createdAt field
});

const JournalForm: React.FC<JournalFormProps> = ({ onSave, onCancel, initialData }) => {
  const { state: workplaceState } = useWorkplace();
  const currentWorkplaceId = initialData?.workplaceID || workplaceState.selectedWorkplace?.workplaceID;

  const [formData, setFormData] = useState<JournalWithTransactions>(() => {
    const today = new Date().toISOString().split('T')[0];
    // Need to adapt initial transaction creation to match Omit<...> type
    const initialDebit = createDefaultTransaction(TransactionType.DEBIT, today);
    const initialCredit = createDefaultTransaction(TransactionType.CREDIT, today);
    return (
      initialData || {
        journalID: '',
        workplaceID: currentWorkplaceId || '',
        date: today,
        description: '',
        currencyCode: 'USD',
        createdAt: today,
        createdBy: '',
        lastUpdatedAt: today,
        lastUpdatedBy: '',
        transactions: [
           { ...initialDebit, transactionID: `temp-${Date.now()}-1`, journalID: '' } as unknown as Transaction, // Cast needed due to Omit
           { ...initialCredit, transactionID: `temp-${Date.now()}-2`, journalID: '' } as unknown as Transaction,
        ],
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
      const response = await apiService.get<Account[]>(`/workplaces/${currentWorkplaceId}/accounts`);
      if (response.data) {
        setAccounts(response.data);
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
    const updatedTransactions = [...formData.transactions];
    // Amount is already a string from input
    const fieldName = field as keyof Transaction;
    
    updatedTransactions[index] = {
      ...updatedTransactions[index],
      [fieldName]: value,
      // Set createdAt based on the journal's date
      createdAt: formData.date, 
    };
    // No need to delete transactionDate

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
  
  const formDisabled = accountsLoading || !!accountsError || !currentWorkplaceId;

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
            />
          </div>
          
          <fieldset disabled={formDisabled} className="contents">
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
                  <Plus className="h-4 w-4 mr-1" /> Add Row
                </Button>
              </div>
              
              {errors.transactions && (
                <p className="text-sm text-red-500">{errors.transactions}</p>
              )}
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-2 text-left font-medium">Account</th>
                      <th className="pb-2 text-left font-medium">Description</th>
                      <th className="pb-2 text-left font-medium">Type</th>
                      <th className="pb-2 text-right font-medium">Amount</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.transactions.map((transaction, index) => (
                      <tr key={transaction.transactionID} className="border-b">
                        <td className="py-2 pr-2">
                          <Select 
                            value={transaction.accountID}
                            onValueChange={(value) => handleTransactionChange(index, 'accountID', value)}
                            required
                          >
                            <SelectTrigger>
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
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="text"
                            placeholder="Line notes (optional?)"
                            value={transaction.notes || ''}
                            onChange={(e) => handleTransactionChange(index, 'notes', e.target.value)}
                            className="h-9"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Select
                            value={transaction.transactionType}
                            onValueChange={(value) => handleTransactionChange(index, 'transactionType', value)}
                            required
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={TransactionType.DEBIT}>Debit</SelectItem>
                              <SelectItem value={TransactionType.CREDIT}>Credit</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={transaction.amount}
                            onChange={(e) => handleTransactionChange(index, 'amount', e.target.value)}
                            required
                            step="0.01"
                            className="text-right h-9"
                          />
                        </td>
                        <td className="py-2 pl-2 text-right">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeTransaction(index)}
                            disabled={formData.transactions.length <= 2}
                            className="text-muted-foreground hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t">
                      <td colSpan={3} className="pt-3 font-medium text-right">Total</td>
                      <td className="pt-3 font-medium text-right">${debitTotal.toFixed(2)}</td>
                      <td></td>
                    </tr>
                    <tr >
                      <td colSpan={3} className="font-medium text-right"></td>
                      <td className="font-medium text-right">${creditTotal.toFixed(2)}</td>
                      <td></td>
                    </tr>
                    <tr className="border-t">
                      <td colSpan={3} className="pt-2 font-semibold text-right">Balance</td>
                      <td className={`pt-2 font-semibold text-right ${isJournalBalanced() ? '' : 'text-red-500'}`}>
                        ${(debitTotal - creditTotal).toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              {errors.balance && (
                <p className="text-sm text-red-500 text-center mt-2">{errors.balance}</p>
              )}
            </div>
          </fieldset>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={accountsLoading}>Cancel</Button>
          <Button type="submit" disabled={formDisabled}>Save Journal</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default JournalForm;

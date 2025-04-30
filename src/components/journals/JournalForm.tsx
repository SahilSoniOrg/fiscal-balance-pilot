
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JournalWithTransactions, Transaction, TransactionType, Account } from '@/lib/types';
import { Trash2, Plus } from 'lucide-react';
import apiService from '@/services/apiService';

interface JournalFormProps {
  onSave: (journal: JournalWithTransactions) => void;
  onCancel: () => void;
  initialData?: JournalWithTransactions;
}

const JournalForm: React.FC<JournalFormProps> = ({ onSave, onCancel, initialData }) => {
  const [formData, setFormData] = useState<JournalWithTransactions>(
    initialData || {
      journalId: '',
      workplaceId: apiService.mockData.workplaces[0].workplaceId,
      journalDate: new Date().toISOString().split('T')[0],
      name: '',
      description: '',
      transactions: [
        {
          transactionId: `temp-${Date.now()}-1`,
          journalId: '',
          accountId: '',
          amount: 0,
          transactionType: TransactionType.DEBIT,
          currencyCode: 'USD',
          description: '',
          transactionDate: new Date().toISOString().split('T')[0],
        },
        {
          transactionId: `temp-${Date.now()}-2`,
          journalId: '',
          accountId: '',
          amount: 0,
          transactionType: TransactionType.CREDIT,
          currencyCode: 'USD',
          description: '',
          transactionDate: new Date().toISOString().split('T')[0],
        },
      ],
    }
  );
  
  const [errors, setErrors] = useState<{
    name?: string;
    date?: string;
    transactions?: string;
    balance?: string;
  }>({});
  
  const accounts = apiService.mockData.accounts;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear validation errors when field is edited
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };
  
  const handleTransactionChange = (index: number, field: keyof Transaction, value: any) => {
    const updatedTransactions = [...formData.transactions];
    updatedTransactions[index] = {
      ...updatedTransactions[index],
      [field]: value,
      // Update transactionDate to match journal date
      transactionDate: formData.journalDate,
    };
    
    setFormData({
      ...formData,
      transactions: updatedTransactions,
    });
    
    // Clear balance error when transactions are updated
    if (errors.balance) {
      setErrors({
        ...errors,
        balance: undefined,
      });
    }
  };
  
  const addTransaction = () => {
    setFormData({
      ...formData,
      transactions: [
        ...formData.transactions,
        {
          transactionId: `temp-${Date.now()}-${formData.transactions.length + 1}`,
          journalId: '',
          accountId: '',
          amount: 0,
          transactionType: TransactionType.DEBIT, // Default to debit
          currencyCode: 'USD',
          description: '',
          transactionDate: formData.journalDate,
        },
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
  };
  
  const isJournalBalanced = (): boolean => {
    const debits = formData.transactions
      .filter(t => t.transactionType === TransactionType.DEBIT)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const credits = formData.transactions
      .filter(t => t.transactionType === TransactionType.CREDIT)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    return Math.abs(debits - credits) < 0.01; // Allow for tiny floating point differences
  };
  
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Journal name is required';
    }
    
    if (!formData.journalDate) {
      newErrors.date = 'Journal date is required';
    }
    
    if (formData.transactions.length < 2) {
      newErrors.transactions = 'A journal must have at least two transactions';
    }
    
    // Check if all transactions have account and amount
    const invalidTransactions = formData.transactions.some(
      t => !t.accountId || t.amount <= 0
    );
    
    if (invalidTransactions) {
      newErrors.transactions = 'All transactions must have an account and amount greater than zero';
    }
    
    if (!isJournalBalanced()) {
      newErrors.balance = 'Journal must be balanced (debits must equal credits)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // In a real app, we would make an API call to save the journal
      onSave(formData);
    }
  };
  
  const debitTotal = formData.transactions
    .filter(t => t.transactionType === TransactionType.DEBIT)
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const creditTotal = formData.transactions
    .filter(t => t.transactionType === TransactionType.CREDIT)
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Journal' : 'Create New Journal'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Journal Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="journalDate">Date</Label>
              <Input
                id="journalDate"
                name="journalDate"
                type="date"
                value={formData.journalDate.split('T')[0]}
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
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Transactions</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addTransaction}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Transaction
              </Button>
            </div>
            
            {errors.transactions && (
              <p className="text-sm text-red-500">{errors.transactions}</p>
            )}
            
            <div className="space-y-4">
              {formData.transactions.map((transaction, index) => (
                <div 
                  key={transaction.transactionId} 
                  className="grid grid-cols-12 gap-2 items-end border p-3 rounded-md"
                >
                  <div className="col-span-4">
                    <Label className="text-xs">Account</Label>
                    <Select
                      value={transaction.accountId}
                      onValueChange={(value) => 
                        handleTransactionChange(index, 'accountId', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account: Account) => (
                          <SelectItem key={account.accountId} value={account.accountId}>
                            {account.accountName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-2">
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={transaction.transactionType}
                      onValueChange={(value) => 
                        handleTransactionChange(
                          index, 
                          'transactionType', 
                          value as TransactionType
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TransactionType.DEBIT}>Debit</SelectItem>
                        <SelectItem value={TransactionType.CREDIT}>Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-2">
                    <Label className="text-xs">Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={transaction.amount}
                      onChange={(e) => 
                        handleTransactionChange(
                          index, 
                          'amount', 
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  
                  <div className="col-span-3">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={transaction.description || ''}
                      onChange={(e) => 
                        handleTransactionChange(index, 'description', e.target.value)
                      }
                      placeholder="Optional"
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTransaction(index)}
                      className="h-10 w-10 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between p-3 bg-muted rounded-md">
              <div className="space-y-1">
                <p className="text-sm font-medium">Total Debits</p>
                <p className="font-bold">${debitTotal.toFixed(2)}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-sm font-medium">Total Credits</p>
                <p className="font-bold">${creditTotal.toFixed(2)}</p>
              </div>
            </div>
            
            {errors.balance && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                {errors.balance}
              </div>
            )}
            
            {debitTotal === creditTotal && debitTotal > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
                Journal is balanced! Debits and credits are equal.
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update Journal' : 'Create Journal'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default JournalForm;

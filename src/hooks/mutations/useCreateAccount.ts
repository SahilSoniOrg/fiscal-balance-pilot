import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import accountService, { AccountRequest } from '@/services/accountService';
import { Account, ApiResponse } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Define TData, TError, TVariables for the mutation
// TData is Account (the data returned by the mutationFn after processing ApiResponse)
// TError is Error
// TVariables is AccountRequest
// TContext is unknown (default)
type UseCreateAccountMutationOptions = Omit<
  UseMutationOptions<Account, Error, AccountRequest, unknown>,
  'mutationFn' // This is set by the hook
>;

export const useCreateAccount = (workplaceId: string, options?: UseCreateAccountMutationOptions) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<Account, Error, AccountRequest>({
    mutationFn: async (accountData: AccountRequest): Promise<Account> => {
      const response = await accountService.createAccount(workplaceId, accountData);
      if (response.error || !response.data) {
        throw new Error(response.error || 'Failed to create account: No data returned');
      }
      return response.data;
    },
    onSuccess: (createdAccount, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['accounts', workplaceId] });
      toast({
        title: 'Success',
        description: `Account "${createdAccount.name}" created successfully.`,
      });
      // Call user-provided onSuccess if it exists
      if (options?.onSuccess) {
        options.onSuccess(createdAccount, variables, context);
      }
    },
    onError: (error, variables, context) => {
      toast({
        title: 'Error Creating Account',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      // Call user-provided onError if it exists
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
    // Spread other options like onMutate, onSettled etc.
    ...options,
  });
};

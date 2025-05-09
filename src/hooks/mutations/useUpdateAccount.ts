import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import accountService, { AccountRequest } from '@/services/accountService';
import { Account, ApiResponse } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface UpdateAccountVariables {
  accountId: string;
  accountData: AccountRequest;
}

// TData is Account
// TError is Error
// TVariables is UpdateAccountVariables
type UseUpdateAccountMutationOptions = Omit<
  UseMutationOptions<Account, Error, UpdateAccountVariables, unknown>,
  'mutationFn'
>;

export const useUpdateAccount = (workplaceId: string, options?: UseUpdateAccountMutationOptions) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<Account, Error, UpdateAccountVariables>({
    mutationFn: async ({ accountId, accountData }: UpdateAccountVariables): Promise<Account> => {
      const response = await accountService.updateAccount(workplaceId, accountId, accountData);
      if (response.error || !response.data) {
        throw new Error(response.error || 'Failed to update account: No data returned');
      }
      return response.data;
    },
    onSuccess: (updatedAccount, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['accounts', workplaceId] });
      toast({
        title: 'Success',
        description: `Account "${updatedAccount.name}" updated successfully.`,
      });
      if (options?.onSuccess) {
        options.onSuccess(updatedAccount, variables, context);
      }
    },
    onError: (error, variables, context) => {
      toast({
        title: 'Error Updating Account',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
    ...options,
  });
};

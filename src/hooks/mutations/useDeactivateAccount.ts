import { useMutation, useQueryClient } from '@tanstack/react-query';
import accountService from '@/services/accountService';
import { Account, ApiResponse } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface DeactivateAccountVariables {
  accountId: string;
}

export const useDeactivateAccount = (workplaceId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<Account, Error, DeactivateAccountVariables>({
    mutationFn: async ({ accountId }: DeactivateAccountVariables): Promise<Account> => {
      const response = await accountService.toggleAccountStatus(workplaceId, accountId, false);
      if (response.error || !response.data) {
        throw new Error(response.error || 'Failed to deactivate account: No data returned');
      }
      return response.data;
    },
    onSuccess: (deactivatedAccount, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accounts', workplaceId] });
      toast({
        title: 'Success',
        description: `Account "${deactivatedAccount.name}" deactivated successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error Deactivating Account',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });
};

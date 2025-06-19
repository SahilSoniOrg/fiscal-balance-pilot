import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Copy, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import apiService from "@/services/apiService";
import { ApiToken, CreateTokenResponse } from "@/lib/types";

// Token expiration options (in seconds)
const EXPIRATION_OPTIONS = [
  { value: '86400', label: '1 day' },
  { value: '604800', label: '7 days' },
  { value: '2592000', label: '30 days' },
  { value: '7776000', label: '90 days' },
  { value: '31536000', label: '1 year' },
];

// Type guard for API response
function isApiResponseWithData<T>(response: any): response is { data: T } {
  return response && typeof response === 'object' && 'data' in response;
}

export function ApiTokensSection() {
  const queryClient = useQueryClient();
  const [tokenName, setTokenName] = useState("");
  const [expiresIn, setExpiresIn] = useState<string>("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [showNewToken, setShowNewToken] = useState(false);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  
  // Format date for display
  const formatTokenDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Check if a token is expired
  const isTokenExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    try {
      return new Date(expiresAt) < new Date();
    } catch (e) {
      return false;
    }
  };

  // Fetch tokens
  const { data: tokens = [], isLoading, isError } = useQuery<ApiToken[], Error, ApiToken[]>({
    queryKey: ["api-tokens"],
    queryFn: async (): Promise<ApiToken[]> => {
      try {
        const response = await apiService.getApiTokens();
        if (isApiResponseWithData<ApiToken[]>(response) && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      } catch (error) {
        console.error('Failed to fetch API tokens:', error);
        throw error;
      }
    },
  });

  // Create token mutation
  const createTokenMutation = useMutation({
    mutationFn: async ({ name, expiresIn }: { name: string; expiresIn?: string }): Promise<CreateTokenResponse> => {
      const expiresInNum = expiresIn ? parseInt(expiresIn, 10) : undefined;
      const response = await apiService.createApiToken(name, expiresInNum);
      if (isApiResponseWithData<CreateTokenResponse>(response)) {
        return response.data;
      }
      throw new Error("Failed to create token");
    },
    onSuccess: (data) => {
      setNewToken(data.token);
      setShowNewToken(true);
      setTokenName("");
      setExpiresIn("");
      queryClient.invalidateQueries({ queryKey: ["api-tokens"] });
      toast.success("API token created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create token: ${error.message}`);
    },
  });

  // Delete token mutation
  const deleteTokenMutation = useMutation({
    mutationFn: async (tokenId: string): Promise<void> => {
      await apiService.deleteApiToken(tokenId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-tokens"] });
      toast.success("Token deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete token: ${error.message}`);
    },
  });

  // Revoke all tokens mutation
  const revokeAllTokensMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await apiService.revokeAllApiTokens();
    },
    onSuccess: () => {
      setShowNewToken(false);
      setNewToken(null);
      queryClient.invalidateQueries({ queryKey: ["api-tokens"] });
      toast.success("All tokens have been revoked");
    },
    onError: (error: Error) => {
      toast.error(`Failed to revoke tokens: ${error.message}`);
    },
    onSettled: () => {
      setIsRevokingAll(false);
    },
  });

  const handleCreateToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenName.trim()) {
      toast.error("Please enter a token name");
      return;
    }
    createTokenMutation.mutate({ 
      name: tokenName.trim(),
      expiresIn: expiresIn === 'never' ? undefined : expiresIn
    });
  };

  const handleCopyToken = () => {
    if (newToken) {
      navigator.clipboard.writeText(newToken);
      toast.success("Token copied to clipboard");
    }
  };

  const handleDeleteToken = (tokenId: string) => {
    if (window.confirm("Are you sure you want to delete this token? This action cannot be undone.")) {
      deleteTokenMutation.mutate(tokenId);
    }
  };

  const handleRevokeAllTokens = () => {
    if (window.confirm("Are you sure you want to revoke all API tokens? This action cannot be undone.")) {
      setIsRevokingAll(true);
      revokeAllTokensMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">API Tokens</h3>
        <p className="text-sm text-muted-foreground">
          Create and manage access tokens for the API
        </p>
      </div>

      {/* Create new token form */}
      <div className="rounded-lg border p-4 space-y-4">
        <h4 className="font-medium">Create New Token</h4>
        <form onSubmit={handleCreateToken} className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="token-name">Token Name</Label>
              <Input
                id="token-name"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="e.g., CI/CD Pipeline"
                className="mt-1 max-w-md"
              />
            </div>
            
            <div>
              <Label htmlFor="token-expiration">Expiration (optional)</Label>
              <Select 
                value={expiresIn} 
                onValueChange={setExpiresIn}
              >
                <SelectTrigger className="mt-1 max-w-md">
                  <SelectValue placeholder="Select an expiration period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">No expiration</SelectItem>
                  {EXPIRATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                The token will expire after the selected period
              </p>
            </div>
            
            <Button 
              type="submit" 
              disabled={createTokenMutation.isPending || !tokenName.trim()}
            >
              {createTokenMutation.isPending ? "Creating..." : "Create Token"}
            </Button>
          </div>
        </form>
      </div>

      {/* Display new token */}
      {showNewToken && newToken && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Your new API token (copy it now, you won't be able to see it again):
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyToken}
              className="text-green-800 hover:bg-green-100 dark:text-green-200 dark:hover:bg-green-900/50"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
          <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-md border border-green-200 dark:border-green-800 break-all">
            <code className="text-sm font-mono">{newToken}</code>
          </div>
          <p className="mt-2 text-xs text-green-700 dark:text-green-300">
            Make sure to copy your token now. You won't be able to see it again!
          </p>
        </div>
      )}

      {/* Token list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Your Tokens</h4>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["api-tokens"] })}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeAllTokens}
              disabled={isLoading || tokens.length === 0 || isRevokingAll}
            >
              {isRevokingAll ? "Revoking..." : "Revoke All Tokens"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No API tokens found. Create one above to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {tokens.map((token) => {
              const isExpired = isTokenExpired(token.expiresAt);
              return (
                <div
                  key={token.id}
                  className={`flex items-center justify-between p-3 border rounded-md ${
                    isExpired ? 'border-destructive/20 bg-destructive/5' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{token.name}</span>
                      {isExpired && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive">
                          Expired
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span>Created: {formatTokenDate(token.createdAt)}</span>
                      {token.expiresAt && (
                        <span className="ml-2">
                          • Expires: {formatTokenDate(token.expiresAt)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last used: {formatTokenDate(token.lastUsedAt) || "Never"}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteToken(token.id)}
                    disabled={deleteTokenMutation.isPending}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Revoke</span>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

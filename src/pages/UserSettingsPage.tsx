import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiTokensSection } from "@/components/settings/ApiTokensSection";
import { Home } from 'lucide-react';

function UserSettingsPage() {
  const navigate = useNavigate();
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Settings</h1>
              <p className="text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="api-tokens" className="space-y-4">
          <TabsList>
            <TabsTrigger value="api-tokens">API Tokens</TabsTrigger>
            {/* Add more tabs here for future settings categories */}
          </TabsList>
          
          <TabsContent value="api-tokens" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Tokens</CardTitle>
                <CardDescription>
                  Manage your API access tokens for programmatic access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ApiTokensSection />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default UserSettingsPage;

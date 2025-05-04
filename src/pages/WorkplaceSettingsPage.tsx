import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkplace } from '@/context/WorkplaceContext';
import MemberManagement from '@/components/workplace/MemberManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, Power, PowerOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const WorkplaceSettingsPage: React.FC = () => {
  const { workplaceId } = useParams<{ workplaceId: string }>();
  const navigate = useNavigate();
  const { state, fetchMembers, activateWorkplace, deactivateWorkplace, selectWorkplace } = useWorkplace();
  const [isActivating, setIsActivating] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch members when selected workplace changes - but only once initially
  useEffect(() => {
    if (state.selectedWorkplace && isLoading) {
      fetchMembers().then(() => {
        setIsLoading(false);
      });
    }
  }, [state.selectedWorkplace]); // Removed fetchMembers from dependencies to prevent loop
  
  const handleActivate = async () => {
    if (!state.selectedWorkplace) return;
    
    setIsActivating(true);
    try {
      await activateWorkplace(state.selectedWorkplace.workplaceID);
      setShowActivateDialog(false);
    } finally {
      setIsActivating(false);
    }
  };
  
  const handleDeactivate = async () => {
    if (!state.selectedWorkplace) return;
    
    setIsDeactivating(true);
    try {
      await deactivateWorkplace(state.selectedWorkplace.workplaceID);
      setShowDeactivateDialog(false);
    } finally {
      setIsDeactivating(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-48">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }
  
  if (!state.selectedWorkplace) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Workplace Selected</AlertTitle>
          <AlertDescription>
            {workplaceId 
              ? `Workplace with ID "${workplaceId}" not found. Please select a valid workplace.` 
              : "Please select a workplace before accessing workplace settings."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Workplace Settings</h1>
      <p className="text-muted-foreground mb-8">
        Manage settings for "{state.selectedWorkplace.name}"
        <span className="font-mono text-xs ml-2">({state.selectedWorkplace.workplaceID})</span>
      </p>
      
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Manage Members</CardTitle>
              <CardDescription>
                Add or remove members from your workplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemberManagement />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage general workplace settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Workplace Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{state.selectedWorkplace.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ID</p>
                    <p className="font-mono text-xs">{state.selectedWorkplace.workplaceID}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p>{new Date(state.selectedWorkplace.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="flex items-center space-x-2">
                      {state.selectedWorkplace.isActive !== false ? (
                        <span className="flex items-center text-green-600">
                          <span className="bg-green-100 p-1 rounded-full mr-1.5">
                            <Power className="h-3 w-3" />
                          </span>
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <span className="bg-red-100 p-1 rounded-full mr-1.5">
                            <PowerOff className="h-3 w-3" />
                          </span>
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p className="text-sm">{state.selectedWorkplace.description || "No description provided."}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              {state.selectedWorkplace.isActive !== false ? (
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeactivateDialog(true)}
                >
                  <PowerOff className="h-4 w-4 mr-2" />
                  Deactivate Workplace
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  onClick={() => setShowActivateDialog(true)}
                >
                  <Power className="h-4 w-4 mr-2" />
                  Activate Workplace
                </Button>
              )}
              <Button variant="outline" disabled>Edit Details</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Activate Dialog */}
      <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Workplace</DialogTitle>
            <DialogDescription>
              Are you sure you want to activate this workplace? This will make it available to all members.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowActivateDialog(false)} 
              disabled={isActivating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleActivate} 
              disabled={isActivating}
            >
              {isActivating ? 'Activating...' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Deactivate Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Workplace</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate this workplace? This will temporarily restrict access to all data and operations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeactivateDialog(false)} 
              disabled={isDeactivating}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeactivate} 
              disabled={isDeactivating}
            >
              {isDeactivating ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkplaceSettingsPage; 
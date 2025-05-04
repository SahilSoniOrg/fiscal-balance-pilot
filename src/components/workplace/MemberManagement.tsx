import React, { useState, useEffect } from 'react';
import { useWorkplace } from '@/context/WorkplaceContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, Plus, Trash2, MoreHorizontal, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { UserWorkplaceRole } from '@/lib/types';

// Define form schema for adding a member
const addMemberSchema = z.object({
  userID: z.string().min(1, { message: 'User ID is required' }),
  role: z.string().min(1, { message: 'Role is required' }),
});

// Define form schema for editing a role
const editRoleSchema = z.object({
  role: z.string().min(1, { message: 'Role is required' }),
});

type AddMemberFormValues = z.infer<typeof addMemberSchema>;
type EditRoleFormValues = z.infer<typeof editRoleSchema>;

const MemberManagement: React.FC = () => {
  const { state, addMember, removeMember, fetchMembers, updateMemberRole } = useWorkplace();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("Members data:", state.members);
  }, [state.members]);

  // Check if current user is admin
  const isAdmin = state.members.some(
    member => member.userID === user?.userID && member.role === UserWorkplaceRole.ADMIN
  );

  // Check if there's only one admin
  const adminCount = state.members.filter(member => member.role === UserWorkplaceRole.ADMIN).length;
  const isLastAdmin = (memberId: string) => {
    return adminCount === 1 && state.members.some(
      member => member.userID === memberId && member.role === UserWorkplaceRole.ADMIN
    );
  };

  // Setup add member form
  const addMemberForm = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      userID: '',
      role: UserWorkplaceRole.MEMBER,
    },
  });

  // Setup edit role form
  const editRoleForm = useForm<EditRoleFormValues>({
    resolver: zodResolver(editRoleSchema),
    defaultValues: {
      role: UserWorkplaceRole.MEMBER,
    },
  });

  // Handle add member form submission
  const onSubmitAddMember = async (values: AddMemberFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await addMember(values.userID, values.role);
      
      if (result.success) {
        setIsAddDialogOpen(false);
        addMemberForm.reset();
      }
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while adding the member.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit role form submission
  const onSubmitEditRole = async (values: EditRoleFormValues) => {
    if (!memberToEdit) return;
    
    setIsEditingRole(true);
    try {
      const result = await updateMemberRole(memberToEdit, values.role);
      
      if (result.success) {
        setIsEditDialogOpen(false);
        setMemberToEdit(null);
        editRoleForm.reset();
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while updating the role.',
        variant: 'destructive',
      });
    } finally {
      setIsEditingRole(false);
    }
  };

  // Handle opening edit role dialog
  const handleEditRole = (userId: string, currentRole: UserWorkplaceRole) => {
    setMemberToEdit(userId);
    editRoleForm.setValue('role', currentRole);
    
    // If this is the last admin, show a warning
    if (isLastAdmin(userId)) {
      toast({
        title: "Warning",
        description: "This is the last admin. You must promote another user to admin before changing this role.",
        variant: "destructive"
      });
    }
    
    setIsEditDialogOpen(true);
  };

  // Handle member removal
  const handleRemoveMember = async (userId: string) => {
    setMemberToRemove(userId);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    
    setIsRemoving(true);
    try {
      const result = await removeMember(memberToRemove);
      
      if (result.success) {
        setMemberToRemove(null);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while removing the member.',
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const refreshMembers = () => {
    fetchMembers();
  };

  // Ensure member fields are properly handled
  const mapMemberName = (member: any) => {
    return member.userName || member.name || "Unknown User";
  };

  return (
    <div>
      {/* Member List */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Members</h3>
        <div className="flex gap-2">
          <Button 
            onClick={refreshMembers} 
            variant="outline" 
            size="sm"
            disabled={state.membersLoading}
          >
            {state.membersLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Member
          </Button>
        </div>
      </div>

      {state.membersError && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
          Error loading members: {state.membersError}
        </div>
      )}

      {state.membersLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : state.members.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-muted/30">
          <p className="text-muted-foreground">No members found in this workplace.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.members.map((member) => (
              <TableRow key={member.userID}>
                <TableCell>{mapMemberName(member)}</TableCell>
                <TableCell className="font-mono text-xs">{member.userID}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      member.role === UserWorkplaceRole.ADMIN ? "default" : 
                      member.role === UserWorkplaceRole.MEMBER ? "outline" : 
                      "secondary"
                    }
                  >
                    {member.role}
                    {isLastAdmin(member.userID) && (
                      <span className="ml-2 text-xs text-amber-500">Last Admin</span>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  {member.joinedAt ? format(new Date(member.joinedAt), 'MMM d, yyyy') : 'Unknown'}
                </TableCell>
                <TableCell>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleEditRole(member.userID, member.role)}
                          disabled={isLastAdmin(member.userID) && member.role === UserWorkplaceRole.ADMIN}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleRemoveMember(member.userID)}
                          disabled={isLastAdmin(member.userID)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {!isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.userID)}
                      disabled={member.role === UserWorkplaceRole.ADMIN || isLastAdmin(member.userID)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add Member Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>
              Enter the user ID and role of the person you want to add to this workplace.
            </DialogDescription>
          </DialogHeader>
          <Form {...addMemberForm}>
            <form onSubmit={addMemberForm.handleSubmit(onSubmitAddMember)} className="space-y-4">
              <FormField
                control={addMemberForm.control}
                name="userID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter user ID" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addMemberForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UserWorkplaceRole.ADMIN}>Admin</SelectItem>
                        <SelectItem value={UserWorkplaceRole.MEMBER}>Member</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Member'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member Role</DialogTitle>
            <DialogDescription>
              Change this member's role in the workplace.
              {memberToEdit && isLastAdmin(memberToEdit) && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-700">
                  This is the last admin user. You must promote another user to admin before changing this role.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <Form {...editRoleForm}>
            <form onSubmit={editRoleForm.handleSubmit(onSubmitEditRole)} className="space-y-4">
              <FormField
                control={editRoleForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={memberToEdit && isLastAdmin(memberToEdit) && field.value === UserWorkplaceRole.ADMIN}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UserWorkplaceRole.ADMIN}>Admin</SelectItem>
                        <SelectItem 
                          value={UserWorkplaceRole.MEMBER}
                          disabled={memberToEdit && isLastAdmin(memberToEdit)}
                        >Member</SelectItem>
                        <SelectItem 
                          value={UserWorkplaceRole.REMOVED}
                          disabled={memberToEdit && isLastAdmin(memberToEdit)}
                        >Removed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isEditingRole}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isEditingRole}>
                  {isEditingRole ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Role'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <Dialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this member from the workplace? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMemberToRemove(null)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveMember}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberManagement; 
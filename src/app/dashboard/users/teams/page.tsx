"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Edit, Trash2, Shield, Crown, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

interface Team {
  id: string;
  name: string;
  organizationId: string;
  organizationName: string;
  memberCount: number;
  createdAt: string;
}

interface TeamMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  joinedAt: string;
}

const roleIcons = {
  admin: Crown,
  owner: Shield,
  supervisor: Eye,
  employee: Users,
};

const roleColors = {
  admin: "bg-purple-100 text-purple-800 border-purple-200",
  owner: "bg-blue-100 text-blue-800 border-blue-200", 
  supervisor: "bg-green-100 text-green-800 border-green-200",
  employee: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function UsersTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("employee");

  const loadTeams = async () => {
    setIsLoading(true);
    try {
      const user = authClient.useSession();
      if (!user.data?.session?.activeOrganizationId) {
        throw new Error("No active organization");
      }

      const response = await fetch(`/api/teams?organizationId=${user.data.session.activeOrganizationId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }
      
      const teamsData = await response.json();
      setTeams(teamsData);
    } catch (err) {
      console.error("Failed to load teams:", err);
      toast.error("Failed to load teams");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members`);
      if (!response.ok) {
        throw new Error("Failed to fetch team members");
      }
      
      const membersData = await response.json();
      setTeamMembers(membersData);
    } catch (err) {
      console.error("Failed to load team members:", err);
      toast.error("Failed to load team members");
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }

    try {
      const user = authClient.useSession();
      if (!user.data?.session?.activeOrganizationId) {
        throw new Error("No active organization");
      }

      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTeamName,
          organizationId: user.data.session.activeOrganizationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create team");
      }

      toast.success("團隊建立成功");
      setNewTeamName("");
      setIsCreateTeamOpen(false);
      loadTeams();
    } catch (err) {
      console.error("Failed to create team:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create team");
    }
  };

  const inviteMemberToTeam = async () => {
    if (!selectedTeam || !newMemberEmail.trim()) {
      toast.error("Please select a team and enter member email");
      return;
    }

    try {
      // Search for user using admin API with email search
      const userResponse = await fetch(`/api/admin/users?search=${encodeURIComponent(newMemberEmail)}&searchField=email`, {
        credentials: 'include'
      });
      if (!userResponse.ok) {
        throw new Error("User not found");
      }
      
      const usersData = await userResponse.json();
      if (!usersData.users || usersData.users.length === 0) {
        throw new Error("User not found");
      }
      
      const userData = usersData.users[0]; // Get the first matching user
      
      const response = await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userData.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add member to team");
      }

      toast.success("成員已加入團隊");
      setNewMemberEmail("");
      setNewMemberRole("employee");
      setIsAddMemberOpen(false);
      
      if (selectedTeam) {
        loadTeamMembers(selectedTeam.id);
      }
    } catch (err) {
      console.error("Failed to invite member:", err);
      toast.error(err instanceof Error ? err.message : "Failed to send invitation");
    }
  };

  const removeMemberFromTeam = async (memberId: string) => {
    if (!selectedTeam) return;
    
    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove member");
      }

      toast.success("成員已從團隊移除");
      loadTeamMembers(selectedTeam.id);
    } catch (err) {
      console.error("Failed to remove member:", err);
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const getRoleIcon = (role: string) => {
    const IconComponent = roleIcons[role as keyof typeof roleIcons] || Users;
    return <IconComponent className="h-4 w-4" />;
  };

  const getRoleColor = (role: string) => {
    return roleColors[role as keyof typeof roleColors] || roleColors.employee;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
            <p className="text-muted-foreground">Manage organization teams and member roles</p>
          </div>
        </div>
        
        <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => loadTeams()}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Create a new team within your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Enter team name"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateTeamOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={createTeam}>Create Team</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teams List */}
        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
            <CardDescription>Select a team to manage its members</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading teams...
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No teams found. Create your first team to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTeam?.id === team.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => {
                      setSelectedTeam(team);
                      loadTeamMembers(team.id);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{team.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {team.organizationName}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                Team Members
                {selectedTeam && ` - ${selectedTeam.name}`}
              </span>
              {selectedTeam && (
                <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Team Member</DialogTitle>
                      <DialogDescription>
                        Invite a new member to join {selectedTeam.name}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="memberEmail">Email</Label>
                        <Input
                          id="memberEmail"
                          type="email"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          placeholder="Enter member email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="memberRole">Role</Label>
                        <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="employee">Employee</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsAddMemberOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={inviteMemberToTeam}>
                          Send Invitation
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardTitle>
            <CardDescription>
              {selectedTeam 
                ? "Manage roles and permissions for team members"
                : "Select a team to view and manage its members"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedTeam ? (
              <div className="text-center py-8 text-muted-foreground">
                Select a team from the left to view its members
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No members in this team yet. Add members to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{member.userName}</div>
                          <div className="text-sm text-muted-foreground">
                            {member.userEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`${getRoleColor(member.role)} flex items-center gap-1 w-fit`}
                        >
                          {getRoleIcon(member.role)}
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeMemberFromTeam(member.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Users,
  Plus,
  Mail,
  Shield,
  Eye,
  Trash2,
  UserCheck,
  Activity
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TeamManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: allMembers = [], isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: () => base44.entities.TeamMember.list("-created_date", 200)
  });

  const teamMembers = allMembers;
  const totalPages = Math.ceil(teamMembers.length / itemsPerPage);
  const paginatedMembers = teamMembers.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      const member = await base44.entities.TeamMember.create(data);
      
      // Send invitation notification
      await base44.functions.invoke('sendNotification', {
        userId: user.id,
        notificationType: 'team_invite',
        data: {
          invitedEmail: data.user_email,
          invitedName: data.full_name,
          teamRole: data.team_role
        }
      });
      
      return member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["team-members"]);
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("member");
    }
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamMember.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["team-members"]);
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => base44.entities.TeamMember.update(id, { team_role: role }),
    onSuccess: () => {
      queryClient.invalidateQueries(["team-members"]);
    }
  });

  const roleIcons = {
    manager: Shield,
    member: UserCheck,
    viewer: Eye
  };

  const roleColors = {
    manager: "text-purple-500",
    member: "text-blue-500",
    viewer: "text-slate-500"
  };

  if (user?.account_type !== "business") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600 mb-4">Team management is only available for business accounts</p>
          <Button onClick={() => navigate(createPageUrl("BusinessPricing"))}>
            Upgrade to Business
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-slate-50"
    )}>
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-30 border-b",
        theme === "dark" 
          ? "bg-[#0F1E2E] border-[#57CFA4]/20" 
          : "bg-white border-slate-200"
      )}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className={cn(
                "rounded-xl",
                theme === "dark"
                  ? "hover:bg-[#57CFA4]/10 text-[#57CFA4]"
                  : "hover:bg-slate-100 text-[#1E3A57]"
              )}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className={cn(
                "text-lg font-bold",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                Team Management
              </h1>
              <p className={cn(
                "text-sm",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                Manage your team members and permissions
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowInviteDialog(true)}
            className="bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">
        {/* Team Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className={cn(
            "rounded-2xl p-6 border",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <Users className="w-8 h-8 mb-3 text-[#F7B600]" />
            <p className={cn(
              "text-3xl font-bold mb-1",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              {teamMembers.length}
            </p>
            <p className={cn(
              "text-sm",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>
              Team Members
            </p>
          </div>

          <div className={cn(
            "rounded-2xl p-6 border",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <Activity className="w-8 h-8 mb-3 text-[#57CFA4]" />
            <p className={cn(
              "text-3xl font-bold mb-1",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              {teamMembers.filter(m => m.status === "active").length}
            </p>
            <p className={cn(
              "text-sm",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>
              Active Members
            </p>
          </div>

          <div className={cn(
            "rounded-2xl p-6 border",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <Shield className="w-8 h-8 mb-3 text-purple-500" />
            <p className={cn(
              "text-3xl font-bold mb-1",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              {teamMembers.filter(m => m.team_role === "manager").length}
            </p>
            <p className={cn(
              "text-sm",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>
              Managers
            </p>
          </div>
        </div>

        {/* Team Members List */}
        <div className={cn(
          "rounded-2xl border overflow-hidden",
          theme === "dark"
            ? "bg-[#1A2F42] border-[#57CFA4]/20"
            : "bg-white border-slate-200"
        )}>
          <div className="p-6 border-b border-inherit">
            <h2 className={cn(
              "font-bold",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Team Members
            </h2>
          </div>

          <div className="divide-y divide-inherit">
            {isLoading ? (
              <div className="p-8 text-center">
                <p className={cn(
                  "text-sm",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  Loading team members...
                </p>
              </div>
            ) : teamMembers.length > 0 ? (
              <>
              {paginatedMembers.map((member) => {
                const RoleIcon = roleIcons[member.team_role];
                return (
                  <div key={member.id} className="p-6 flex items-center justify-between hover:bg-black/5 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
                        theme === "dark"
                          ? "bg-[#57CFA4]/20 text-[#57CFA4]"
                          : "bg-slate-100 text-[#1E3A57]"
                      )}>
                        {member.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className={cn(
                          "font-semibold",
                          theme === "dark" ? "text-white" : "text-[#1E3A57]"
                        )}>
                          {member.full_name}
                        </h3>
                        <p className={cn(
                          "text-sm",
                          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                        )}>
                          {member.user_email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={cn(
                          "text-sm font-medium",
                          theme === "dark" ? "text-white" : "text-[#1E3A57]"
                        )}>
                          {member.completed_issues_count} completed
                        </p>
                      </div>

                      <div className={cn(
                        "px-3 py-1.5 rounded-lg border flex items-center gap-2",
                        theme === "dark"
                          ? "bg-[#0F1E2E] border-[#57CFA4]/20"
                          : "bg-slate-50 border-slate-200"
                      )}>
                        <RoleIcon className={cn("w-4 h-4", roleColors[member.team_role])} />
                        <span className={cn(
                          "text-sm capitalize",
                          theme === "dark" ? "text-white" : "text-[#1E3A57]"
                        )}>
                          {member.team_role}
                        </span>
                      </div>

                      <Select
                        value={member.team_role}
                        onValueChange={(role) => updateRoleMutation.mutate({ id: member.id, role })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMutation.mutate(member.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {totalPages > 1 && (
                <div className="p-6 border-t border-inherit flex items-center justify-between">
                  <p className={cn(
                    "text-sm",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                  )}>
                    Showing {((page - 1) * itemsPerPage) + 1}-{Math.min(page * itemsPerPage, teamMembers.length)} of {teamMembers.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className={cn(
                      "text-sm px-3",
                      theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                    )}>
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
              </>
            ) : (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className={cn(
                  "text-sm mb-4",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  No team members yet
                </p>
                <Button
                  onClick={() => setShowInviteDialog(true)}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Your First Team Member
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className={cn(
          "max-w-lg",
          theme === "dark" ? "bg-[#1A2F42] border-[#57CFA4]/20" : "bg-white"
        )}>
          <DialogHeader>
            <DialogTitle className={cn(
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Invite Team Member
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            inviteMutation.mutate({
              user_email: inviteEmail,
              full_name: inviteName,
              team_role: inviteRole,
              status: "invited"
            });
          }} className="space-y-4 mt-4">
            <div>
              <Label className={cn(
                "mb-2 block",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                Email Address *
              </Label>
              <Input
                type="email"
                placeholder="team.member@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className={cn(
                  theme === "dark"
                    ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                    : "bg-white border-slate-200"
                )}
                required
              />
            </div>

            <div>
              <Label className={cn(
                "mb-2 block",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                Full Name *
              </Label>
              <Input
                placeholder="John Smith"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className={cn(
                  theme === "dark"
                    ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                    : "bg-white border-slate-200"
                )}
                required
              />
            </div>

            <div>
              <Label className={cn(
                "mb-2 block",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                Role *
              </Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className={cn(
                  theme === "dark"
                    ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                    : "bg-white border-slate-200"
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager - Full access</SelectItem>
                  <SelectItem value="member">Member - Can be assigned issues</SelectItem>
                  <SelectItem value="viewer">Viewer - View only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={inviteMutation.isPending}
                className="flex-1 bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
              >
                {inviteMutation.isPending ? "Inviting..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
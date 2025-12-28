import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { UserCheck, Users } from "lucide-react";
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

export default function AssignIssueDialog({ issue, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const [selectedMember, setSelectedMember] = useState("");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: () => base44.entities.TeamMember.filter({ status: "active" })
  });

  const assignMutation = useMutation({
    mutationFn: async (memberEmail) => {
      const member = teamMembers.find(m => m.user_email === memberEmail);
      
      await base44.entities.Issue.update(issue.id, {
        assigned_to_email: memberEmail,
        assigned_to_name: member.full_name,
        assigned_date: new Date().toISOString(),
        assigned_by_email: user.email
      });

      // Update team member's assigned count
      await base44.entities.TeamMember.update(member.id, {
        assigned_issues_count: (member.assigned_issues_count || 0) + 1,
        last_active: new Date().toISOString()
      });

      // Send notification to assigned member
      await base44.functions.invoke('sendNotification', {
        userId: user.id,
        notificationType: 'issue_assigned',
        data: {
          issueId: issue.id,
          issueTitle: issue.title,
          assignedToEmail: memberEmail,
          assignedToName: member.full_name,
          propertyName: issue.property_name
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["issue", issue.id]);
      queryClient.invalidateQueries(["business-issues"]);
      queryClient.invalidateQueries(["team-members"]);
      onOpenChange(false);
      setSelectedMember("");
    }
  });

  const handleAssign = () => {
    if (selectedMember) {
      assignMutation.mutate(selectedMember);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-lg",
        theme === "dark" ? "bg-[#1A2F42] border-[#57CFA4]/20" : "bg-white"
      )}>
        <DialogHeader>
          <DialogTitle className={cn(
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Assign Issue
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className={cn(
            "p-4 rounded-xl border",
            theme === "dark"
              ? "bg-[#0F1E2E] border-[#57CFA4]/20"
              : "bg-slate-50 border-slate-200"
          )}>
            <p className={cn(
              "font-semibold mb-1",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              {issue.title}
            </p>
            {issue.property_name && (
              <p className={cn(
                "text-sm",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                Property: {issue.property_name}
              </p>
            )}
          </div>

          {teamMembers.length > 0 ? (
            <>
              <div>
                <Label className={cn(
                  "mb-2 block",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  Assign to Team Member
                </Label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger className={cn(
                    theme === "dark"
                      ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                      : "bg-white border-slate-200"
                  )}>
                    <SelectValue placeholder="Select a team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.user_email}>
                        <div className="flex items-center gap-2">
                          <span>{member.full_name}</span>
                          <span className="text-xs text-slate-500">
                            ({member.assigned_issues_count || 0} assigned)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssign}
                  disabled={!selectedMember || assignMutation.isPending}
                  className="flex-1 bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  {assignMutation.isPending ? "Assigning..." : "Assign"}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className={cn(
                "text-sm mb-4",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                No team members available. Invite team members first.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
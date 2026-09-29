import { Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@godzilla/ui";
import { erp } from "@portfolio/shared";
import { formatDateTime } from "@/lib/erp/format";
import { MemberActions, RevokeInvite } from "./team-manager";
import { EmptyState } from "./ui";

type Scope = "team" | "owner";

/** Pessoas com acesso: papel, situação, último acesso e ações (menos para si mesmo). */
export function MembersTable({ members, scope, currentUserId, showCompany }: { members: erp.TeamMember[]; scope: Scope; currentUserId: string; showCompany?: boolean }) {
  return (
    <Card className="p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pessoa</TableHead>
            {showCompany && <TableHead>Empresa</TableHead>}
            <TableHead>Situação</TableHead>
            <TableHead>Último acesso</TableHead>
            <TableHead className="text-right">Acesso</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <span className="flex flex-col">
                  <span className="font-medium">{member.name}</span>
                  <span className="font-mono text-caption text-muted-foreground">{member.email}</span>
                </span>
              </TableCell>
              {showCompany && <TableCell className="text-body-sm">{member.workspace?.name}</TableCell>}
              <TableCell>
                <Badge variant={member.status === "blocked" ? "destructive" : "success"}>{erp.USER_STATUS_LABELS[member.status]}</Badge>
              </TableCell>
              <TableCell className="font-mono text-caption text-muted-foreground">{member.lastLoginAt ? formatDateTime(member.lastLoginAt) : "nunca"}</TableCell>
              <TableCell className="text-right">
                {member.id === currentUserId ? (
                  <span className="text-caption text-muted-foreground">você · {member.isOwner ? "dono" : erp.ROLE_LABELS[member.role]}</span>
                ) : (
                  <MemberActions scope={scope} member={member} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export function InvitesTable({ invites, scope, showCompany }: { invites: erp.Invite[]; scope: Scope; showCompany?: boolean }) {
  if (invites.length === 0) return <EmptyState>Nenhum convite pendente.</EmptyState>;
  return (
    <Card className="p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>E-mail</TableHead>
            {showCompany && <TableHead>Empresa</TableHead>}
            <TableHead>Papel</TableHead>
            <TableHead>Vence</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.map((invite) => (
            <TableRow key={invite.id}>
              <TableCell className="font-mono text-body-sm">{invite.email}</TableCell>
              {showCompany && <TableCell className="text-body-sm">{invite.workspace?.name}</TableCell>}
              <TableCell>{erp.ROLE_LABELS[invite.role]}</TableCell>
              <TableCell className="font-mono text-caption text-muted-foreground">{formatDateTime(invite.expiresAt)}</TableCell>
              <TableCell className="text-right">
                <RevokeInvite scope={scope} invite={invite} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

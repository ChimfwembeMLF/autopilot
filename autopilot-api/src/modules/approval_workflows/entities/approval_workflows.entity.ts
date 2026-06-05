import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Roles } from '../../auth/rbac/roles/entities/roles.entity';
import { UserEntity } from '../../user/user.entity';

@Entity({ name: 'approval_workflows' })
export class ApprovalWorkflows {
  @PrimaryColumn({ type: 'text' })
  actionKey: string;

  @Column({ type: 'text' })
  label: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean' })
  isEnabled: boolean;

  @Column({ type: 'uuid' })
  approverRoleId: string;

  @Column({ type: 'uuid' })
  updatedBy: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => Roles, { nullable: false })
  @JoinColumn({ name: 'approver_role_id' })
  approverRole: Roles;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: UserEntity;
}

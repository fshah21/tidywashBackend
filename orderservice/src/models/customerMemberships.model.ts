import {
    Table,
    Model,
    Column,
    PrimaryKey,
    ForeignKey,
    CreatedAt,
    DataType,
} from "sequelize-typescript";
  
import { UUID } from "crypto";
import { Membership } from "./membership.model";

export enum TimeSlot {
    MORNING = "morning",
    EVENING = "evening",
}

export enum Day {
    SUNDAY = "sunday",
    MONDAY = "monday",
    TUESDAY = "tuesday",
    WEDNESDAY = "wednesday",
    THURSDAY = "thursday",
    FRIDAY = "friday",
    SATURDAY = "saturday",
}

export enum MembershipType {
    ONE_MONTH = "1-month",
    THREE_MONTH = "3-month"
}

export enum CustomerMembershipStatus {
  ACTIVE = "active",
  PAID = "paid",
  CANCELLED = "cancelled",
  EXPIRED = "expired"
}

@Table({ tableName: 'customer_memberships' })
export class CustomerMembership extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id: UUID;

  @ForeignKey(() => Membership)
  @Column({ type: DataType.UUID })
  plan_id: UUID;

  @Column({ type: DataType.UUID, allowNull: false })
  customer_id: UUID;

  @Column({ type: DataType.ENUM(...Object.values(MembershipType)) })
  type: MembershipType;

  @Column({ type: DataType.DATE })
  start_date: Date;

  @Column({ type: DataType.DATE })
  end_date: Date;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  orders_created: number;

  @Column({ type: DataType.UUID })
  address_id: UUID;

  @Column({ type: DataType.ENUM(...Object.values(Day)) })
  preferred_pickup_day: Day;

  @Column({ type: DataType.ENUM(...Object.values(TimeSlot)) })
  preferred_pickup_slot: TimeSlot;

  @Column({ type: DataType.ENUM(...Object.values(Day)) })
  preferred_delivery_day: Day;

  @Column({ type: DataType.ENUM(...Object.values(TimeSlot)) })
  preferred_delivery_slot: TimeSlot;

  @Column({ type: DataType.DATE })
  next_order_date: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  ref_membership_id: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: true
  })
  is_cancellable: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(CustomerMembershipStatus)),
    allowNull: true,
    defaultValue: CustomerMembershipStatus.ACTIVE, 
  })
  status: CustomerMembershipStatus;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_date: Date;
}

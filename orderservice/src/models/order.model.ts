import {
    Table,
    Model,
    Column,
    PrimaryKey,
    CreatedAt,
    UpdatedAt,
    DataType,
    ForeignKey,
    BelongsTo
  } from "sequelize-typescript";
  
import { UUID } from "crypto";
import { CustomerMembership } from "./customerMemberships.model";

export enum OrderStatus {
    ACTIVE = "active",
    PAID = "paid",
    ASSIGNED = "assigned",
    PICKUP_STARTED = "pickup_started",
    // DELIVERY_STARTED = "delivery_started",
    // PICKUP_COMPLETED = "pickup_completed",
    // DELIVERY_COMPLETED = "delivery_completed",
    WASH_IN_PROGRESS = "wash_in_progress",
    DELIVERED = "delivered",
    OUT_FOR_DELIVERY = "out_for_delivery",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    SCHEDULED = "scheduled"
}

export enum TimeSlot {
    MORNING = "morning",
    NOON = "noon",
    EVENING = "evening",
    NIGHT = "night",
}
  
@Table({ tableName: "orders" })
export class Order extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
    })
    id: UUID;

    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    customer_id: UUID;

    @ForeignKey(() => CustomerMembership)
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    user_membership_id: UUID;

    @BelongsTo(() => CustomerMembership)
    user_memebership: CustomerMembership;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    ref_order_id: string;

    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    pickup_employee_id: UUID;

    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    delivery_employee_id: UUID;

    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    cart_id: UUID;

    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    address_id: UUID;

    @Column({
        type: DataType.ENUM(...Object.values(OrderStatus)),
        allowNull: false,
        defaultValue: OrderStatus.PAID,
    })
    status: OrderStatus;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    pickup_date: Date;
    
    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    delivery_date: Date;

    @Column({
        type: DataType.ENUM(...Object.values(TimeSlot)),
        allowNull: true,
    })
    pickup_slot: TimeSlot;

    @Column({
        type: DataType.ENUM(...Object.values(TimeSlot)),
        allowNull: true,
    })
    delivery_slot: TimeSlot;

    @CreatedAt
    @Column({ type: DataType.DATE, allowNull: false })
    created_date: Date;

    @UpdatedAt
    @Column({ type: DataType.DATE, allowNull: false })
    modified_date: Date;
}
  
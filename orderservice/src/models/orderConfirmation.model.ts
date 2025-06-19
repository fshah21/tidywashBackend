import {
    Table,
    Model,
    Column,
    PrimaryKey,
    ForeignKey,
    CreatedAt,
    UpdatedAt,
    DataType,
  } from "sequelize-typescript";
  
  import { Order } from "./order.model"; // adjust path as needed
  import { UUID } from "crypto";
  
  export enum ConfirmationType {
    PICKUP = "pickup",
    DELIVERY = "delivery",
  }
  
  @Table({ tableName: "order_confirmations" })
  export class OrderConfirmation extends Model {
    @PrimaryKey
    @Column({
      type: DataType.UUID,
      defaultValue: DataType.UUIDV4,
    })
    id: UUID;
  
    @ForeignKey(() => Order)
    @Column({
      type: DataType.UUID,
      allowNull: false,
    })
    order_id: UUID;
  
    @Column({
      type: DataType.ENUM(...Object.values(ConfirmationType)),
      allowNull: false,
    })
    type: ConfirmationType; // pickup or delivery
  
    @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    otp: string; // store plain OTP or hash (you can hash if needed)
  
    @Column({
      type: DataType.STRING,
      allowNull: true,
    })
    file_url: string; // file/image uploaded during confirmation
  
    @CreatedAt
    @Column({ type: DataType.DATE })
    created_date: Date;
  
    @UpdatedAt
    @Column({ type: DataType.DATE })
    modified_date: Date;
  }
  
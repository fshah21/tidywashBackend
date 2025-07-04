// src/models/employeemodel.ts
import { UUID } from "crypto";
import { Customer } from "./customer.model";

import {
  Model,
  Column,
  Table,
  DataType,
  PrimaryKey,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";

@Table({ tableName: "addresses" })
export class Address extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  id: UUID;

  @CreatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  created_date: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  modified_date: Date;

  @ForeignKey(() => Customer)
  @Column({ type: DataType.UUID, allowNull: true })
  customer_id: UUID;

  @BelongsTo(() => Customer, {
    foreignKey: "customer_id",
    targetKey: "id",
  })
  customer: Customer;

  @Column({ type: DataType.STRING, allowNull: false })
  line1: string;

  @Column({ type: DataType.STRING, allowNull: true })
  line2: string;

  @Column({ type: DataType.STRING, allowNull: false })
  city: string;

  @Column({ type: DataType.STRING, allowNull: false })
  state: string;

  @Column({ type: DataType.STRING, allowNull: false })
  pincode: string;

  @Column({ type: DataType.STRING, allowNull: false })
  country: string;

  @Column({ type: DataType.STRING, allowNull: false })
  nick_name: string;

  @Column({ type: DataType.DOUBLE, allowNull: true })
  latitude: number;

  @Column({ type: DataType.DOUBLE, allowNull: true })
  longitude: number;
}

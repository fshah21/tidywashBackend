// src/models/employeemodel.ts
import { UUID } from "crypto";
import { User } from "./user.model"; // this is the User model file

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

@Table({ tableName: "customers" })
export class Customer extends Model {
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

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  user_id: UUID;

  @BelongsTo(() => User, {
    foreignKey: "user_id",
    targetKey: "id",
  })
  user: User;
}

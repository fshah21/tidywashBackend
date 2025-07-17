import {
    Table,
    Model,
    Column,
    PrimaryKey,
    CreatedAt,
    UpdatedAt,
    DataType,
  } from "sequelize-typescript";
  
import { UUID } from "crypto";

@Table({ tableName: 'memberships' })
export class Membership extends Model {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id: UUID;

  @Column({ type: DataType.STRING, allowNull: false }) // e.g. "1 Month", "3 Months"
  name: string;

  @Column({ type: DataType.INTEGER, allowNull: false }) // 4 or 12
  total_orders: number;

  @Column({ type: DataType.INTEGER, allowNull: false }) // days between orders
  interval_days: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false }) // e.g. 1000, 3000
  price: number;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_date: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  modified_date: Date;
}

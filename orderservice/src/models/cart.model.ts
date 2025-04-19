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
  
export enum CartStatus {
    ACTIVE = "active",
    CONVERTED = "converted",
}
  
@Table({ tableName: "cart" })
export class Cart extends Model {
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

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
    })
    total_amount: number;

    @Column({
        type: DataType.ENUM(...Object.values(CartStatus)),
        allowNull: false,
        defaultValue: CartStatus.ACTIVE,
    })
    status: CartStatus;

    @CreatedAt
    @Column({ type: DataType.DATE, allowNull: false })
    created_date: Date;

    @UpdatedAt
    @Column({ type: DataType.DATE, allowNull: false })
    modified_date: Date;
}
  
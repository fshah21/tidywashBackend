import {
    Table,
    Model,
    Column,
    PrimaryKey,
    CreatedAt,
    UpdatedAt,
    DataType,
    ForeignKey,
    BelongsTo,
  } from "sequelize-typescript";
  
import { UUID } from "crypto";
import { Cart } from "./cart.model";
import { Pricing } from "./pricing.model";
  
@Table({ tableName: "cart_items" })
export class CartItem extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
    })
    id: UUID;

    @ForeignKey(() => Cart)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    cart_id: UUID;

    @BelongsTo(() => Cart)
    cart: Cart;

    @ForeignKey(() => Pricing)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    pricing_id: UUID;

    @BelongsTo(() => Pricing)
    pricing: Pricing;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    quantity: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    unit_price: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    total_price: number;

    @CreatedAt
    @Column({ type: DataType.DATE, allowNull: false })
    created_date: Date;

    @UpdatedAt
    @Column({ type: DataType.DATE, allowNull: false })
    modified_date: Date;
}

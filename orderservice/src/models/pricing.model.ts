import {
    Table,
    Model,
    Column,
    PrimaryKey,
    DataType,
    CreatedAt,
    UpdatedAt,
  } from "sequelize-typescript";

import { UUID } from "crypto";
  
// Enums for category and garment_type
export enum PricingCategory {
    WASH_AND_FOLD = "Wash & Fold",
    WASH_AND_IRON = "Wash & Iron",
}

export enum GarmentType {
    TOPS = "tops",
    BOTTOMS = "bottoms",
    BEDSHEETS = "bedsheets",
}
  
@Table({ tableName: "pricing" })
export class Pricing extends Model {
    @PrimaryKey
    @Column({
      type: DataType.UUID,
      defaultValue: DataType.UUIDV4,
    })
    id: UUID;
  
    @Column({
      type: DataType.ENUM(...Object.values(PricingCategory)),
      allowNull: false,
    })
    category: PricingCategory;
  
    @Column({
      type: DataType.ENUM(...Object.values(GarmentType)),
      allowNull: false,
    })
    garment_type: GarmentType;
  
    @Column({
      type: DataType.DECIMAL(10, 2),
      allowNull: false,
    })
    price: number;
  
    @CreatedAt
    @Column({
      type: DataType.DATE,
      allowNull: false,
    })
    created_date: Date;
  
    @UpdatedAt
    @Column({
      type: DataType.DATE,
      allowNull: false,
    })
    modified_date: Date;
}
  
import {
    Model,
    Column,
    Table,
    DataType,
    PrimaryKey,
    CreatedAt,
    UpdatedAt,
  } from "sequelize-typescript";
  import { UUID } from "crypto";
  
  @Table({ tableName: "admins" })
  export class Admin extends Model {
    @PrimaryKey
    @Column({
      type: DataType.UUID,
      defaultValue: DataType.UUIDV4,
    })
    id: UUID;
  
    @Column({
      type: DataType.STRING,
      allowNull: false,
      unique: true,
    })
    email!: string;
  
    @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    password!: string;
  
    @CreatedAt
    @Column({ type: DataType.DATE, allowNull: false })
    created_date: Date;
  
    @UpdatedAt
    @Column({ type: DataType.DATE, allowNull: false })
    modified_date: Date;
  }
  
import { UUID } from "crypto";

import {
  Model,
  Column,
  Table,
  DataType,
  PrimaryKey,
  CreatedAt,
  UpdatedAt,
} from "sequelize-typescript";

export enum UserRole {
  CUSTOMER = "customer",
  EMPLOYEE = "employee",
  ADMIN = "admin",
}

@Table({ tableName: "users" })
export class User extends Model {
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

  @Column({ type: DataType.DATE, allowNull: true })
  last_logged_in: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  ip: string | string[];

  @Column({ type: DataType.JSONB, allowNull: true })
  location_info: object;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    unique: true,
  })
  phone_number!: {
    country_code: string;
    number: string;
  };

  @Column({ type: DataType.ENUM(...Object.values(UserRole)), allowNull: false })
  role!: UserRole;

  @Column({ type: DataType.STRING, allowNull: true })
  email!: string;

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: true })
  device_tokens!: string[];

  @Column({ type: DataType.STRING, allowNull: true })
  first_name!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  last_name!: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  address_list!: [
    {
      line1: string;
      line2: string;
      city: string;
      state: string;
      country: string;
      pincode: string;
    }
  ];

  @Column({ type: DataType.UUID, allowNull: true })
  created_by: UUID | null;
}

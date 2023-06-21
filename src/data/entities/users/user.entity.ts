import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";

@Entity({ name: "users" })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  name: string;

  @Index()
  @Column({ default: null })
  full_name: string;

  @Index()
  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ default: null })
  hashdRt: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isAdmin: boolean;
}

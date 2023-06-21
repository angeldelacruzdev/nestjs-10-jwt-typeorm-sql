import { UserEntity } from "@data/entities/users";
import { Repository } from "typeorm";

export class UserRepository extends Repository<UserEntity> {}

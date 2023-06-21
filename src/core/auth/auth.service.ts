import { CreateUserDto } from "./../users/dto/create-user.dto";
import { UsersService } from "../users/services/users.service";
import { ForbiddenException, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
 
import { AuthDto } from "./../dto/auth.dto";
import { TokensType } from "@app/extras";
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private jwtService: JwtService
  ) {}

  //iniciar sesión
  async login(dto: AuthDto): Promise<TokensType> {
    const user = await this.userService.findOneByEmail(dto.email);

    if (!user) throw new ForbiddenException("Access Denied.");

    const passwordMatches = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatches) throw new ForbiddenException("Access Denied.");

    const tokens = await this.getTokens(user.id, user.email);

    const rtHash = await this.hashPassword(tokens.refresh_token);

    await this.userService.update(user.id, { hashdRt: rtHash });
    return tokens;
  }

  //Cerrar sesión
  async logout(userId: number) {
    await this.userService.update(userId, { hashdRt: null });
  }

  //Refrescar sesión
  async refreshTokens(userId: number, rt: string) {
    const user = await this.userService.findOne(userId);

    if (!user || !user.hashdRt) throw new ForbiddenException("Access Denied.");

    const rtMatches = await bcrypt.compare(rt, user.hashdRt);

    if (!rtMatches) throw new ForbiddenException("Access Denied.");

    const tokens = await this.getTokens(user.id, user.email);

    const rtHash = await this.hashPassword(tokens.refresh_token);

    await this.userService.update(user.id, { hashdRt: rtHash });
    return tokens;
  }

  //Registro de usuario
  async register(dto: CreateUserDto): Promise<Tokens> {
    dto.password = await this.hashPassword(dto.password);

    const user = await this.userService.create(dto);

    const tokens = await this.getTokens(user.id, user.email);

    const rtHash = await this.hashPassword(tokens.refresh_token);

    await this.userService.update(user.id, { hashdRt: rtHash });
    return tokens;
  }

  //Generar tokens de acceso y de refrescar.
  async getTokens(userId: number, email: string) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: "24h",
        }
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: "30d",
        }
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  //Encriptación de la copntraseña
  async hashPassword(data: string) {
    return bcrypt.hash(data, 10);
  }
}

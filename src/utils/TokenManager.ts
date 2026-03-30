import jwt from "jsonwebtoken";
import type { DataInsert, ITokeManager } from "@/interfaces/ITokenManager";
import type { UserPayload } from "@/interfaces/IRequestToken";

export class TokenManager implements ITokeManager {
  createToken(
    data: DataInsert,
    tokenSecret: string,
    expiresIn: string,
  ): string {
    return jwt.sign(
      {
        id: data.id,
        email: data.email,
        tenantId: data.tenantId,
        role: data.role,
      },
      tokenSecret,
      { expiresIn },
    );
  }

  getPayload(token: string, tokenSecret: string): UserPayload {
    const decoded = jwt.verify(token, tokenSecret) as jwt.JwtPayload & {
      id: string;
      email: string;
      tenantId: string;
      role: string;
    };
    return {
      id: String(decoded.id),
      email: decoded.email,
      tenantId: decoded.tenantId,
      role: decoded.role,
    };
  }
}

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { getSupabaseAdmin } from "../supabase-admin";

/**
 * Confirms the caller is a real, signed-in Supabase user — the JWT the
 * frontend forwards from the doctor's own session (see
 * DentVerseDocs/05-api/api-documentation.md: "authenticated staff session,
 * JWT forwarded"). Does not check role or tenant: the endpoint itself never
 * touches the database, so the only thing worth gatekeeping here is "is
 * this a real logged-in user," not "which clinic/role."
 */
@Injectable()
export class StaffAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
    if (!token) {
      throw new UnauthorizedException("Missing bearer token.");
    }

    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException("Invalid or expired session.");
    }
    return true;
  }
}

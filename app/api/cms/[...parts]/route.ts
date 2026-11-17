import { env } from 'cloudflare:workers';
import { handleCms } from '../../../../lib/cms-api.mjs';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) => handleCms(request, env);
export const POST = GET;
export const PATCH = GET;
export const DELETE = GET;

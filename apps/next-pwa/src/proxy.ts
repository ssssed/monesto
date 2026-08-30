import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const MOBILE_USER_AGENT_REGEX = /Android|iPhone|iPod|iPad|Mobile|IEMobile|BlackBerry|webOS/i;

export function proxy(request: NextRequest) {
	const userAgent = request.headers.get('user-agent') ?? '';
	const device = MOBILE_USER_AGENT_REGEX.test(userAgent) ? 'mobile' : 'desktop';

	const url = request.nextUrl.clone();
	url.pathname = `/${device}${url.pathname === '/' ? '' : url.pathname}`;

	return NextResponse.rewrite(url);
}

export const config = {
	matcher: ['/((?!mobile|desktop|api|_next/static|_next/image|favicon.ico).*)']
};

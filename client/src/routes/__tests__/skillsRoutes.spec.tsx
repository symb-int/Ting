import React from 'react';
import { Navigate } from 'react-router-dom';

jest.mock('~/components/Auth', () => ({
  Login: () => null,
  VerifyEmail: () => null,
  Registration: () => null,
  ResetPassword: () => null,
  ApiErrorWatcher: () => null,
  TwoFactorScreen: () => null,
  RequestPasswordReset: () => null,
}));

jest.mock('~/components/Agents/MarketplaceContext', () => ({
  MarketplaceProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('~/components/Agents/Marketplace', () => () => null);
jest.mock('~/components/OAuth', () => ({
  OAuthSuccess: () => null,
  OAuthError: () => null,
}));
jest.mock('~/hooks/AuthContext', () => ({
  AuthContextProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../RouteErrorBoundary', () => () => null);
jest.mock('../Layouts/Startup', () => () => null);
jest.mock('../Layouts/Login', () => () => null);
jest.mock('../Dashboard', () => ({
  __esModule: true,
  default: { path: 'dashboard', element: null },
}));
jest.mock('../ShareRoute', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../ChatRoute', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../Search', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../Root', () => ({
  __esModule: true,
  default: () => null,
}));

import { router } from '../index';

type RouteNode = {
  path?: string;
  element?: React.ReactElement;
  lazy?: unknown;
  children?: RouteNode[];
};

function flattenPaths(routes: RouteNode[]): string[] {
  return routes.flatMap((route) => [
    ...(route.path ? [route.path] : []),
    ...(route.children ? flattenPaths(route.children) : []),
  ]);
}

function findRoute(routes: RouteNode[], path: string): RouteNode | undefined {
  for (const route of routes) {
    if (route.path === path) {
      return route;
    }
    const child = route.children ? findRoute(route.children, path) : undefined;
    if (child) {
      return child;
    }
  }
  return undefined;
}

describe('skills routes', () => {
  it('registers the explicit /skills/new route', () => {
    const paths = flattenPaths((router as unknown as { routes: RouteNode[] }).routes);

    expect(paths).toContain('skills/new');
  });
});

describe('TING I01 project route scope', () => {
  test.each(['projects', 'projects/:projectId'])('redirects /%s to the chat', (path) => {
    const route = findRoute((router as unknown as { routes: RouteNode[] }).routes, path);

    expect(route?.lazy).toBeUndefined();
    expect(route?.element?.type).toBe(Navigate);
    expect(route?.element?.props).toMatchObject({ to: '/c/new', replace: true });
  });
});

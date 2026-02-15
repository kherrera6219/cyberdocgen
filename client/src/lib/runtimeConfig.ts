export type DeploymentMode = 'cloud' | 'local';

export interface RuntimeFeatures {
  organizationManagement: boolean;
  userManagement: boolean;
  multiTenant: boolean;
  sso: boolean;
  mfa: boolean;
}

export interface RuntimeAuthConfig {
  enabled: boolean;
  provider: string;
}

export interface RuntimeConfigResponse {
  deploymentMode: DeploymentMode;
  isProduction: boolean;
  features: RuntimeFeatures;
  auth: RuntimeAuthConfig;
}

const CLOUD_FEATURES: RuntimeFeatures = {
  organizationManagement: true,
  userManagement: true,
  multiTenant: true,
  sso: true,
  mfa: true,
};

const LOCAL_FEATURES: RuntimeFeatures = {
  organizationManagement: false,
  userManagement: false,
  multiTenant: false,
  sso: false,
  mfa: false,
};

function buildDefaultFeatures(mode: DeploymentMode): RuntimeFeatures {
  return mode === 'local' ? LOCAL_FEATURES : CLOUD_FEATURES;
}

function normalizeFeatures(mode: DeploymentMode, incoming?: Partial<RuntimeFeatures>): RuntimeFeatures {
  return {
    ...buildDefaultFeatures(mode),
    ...(incoming ?? {}),
  };
}

export function normalizeRuntimeConfig(raw?: Partial<RuntimeConfigResponse> | null): RuntimeConfigResponse {
  const mode: DeploymentMode = raw?.deploymentMode === 'local' ? 'local' : 'cloud';

  return {
    deploymentMode: mode,
    isProduction: raw?.isProduction ?? false,
    features: normalizeFeatures(mode, raw?.features),
    auth: {
      enabled: raw?.auth?.enabled ?? mode === 'cloud',
      provider: raw?.auth?.provider ?? (mode === 'cloud' ? 'entra-id' : 'bypass'),
    },
  };
}

export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined') {
    return normalizedPath;
  }

  return `http://localhost${normalizedPath}`;
}

export type UserRole = 'ADMIN' | 'ANALYST' | 'USER'

export interface UserWithRole {
    id: string
    email: string
    full_name: string
    role: UserRole
    created_at: string
}

export const ROLE_PERMISSIONS = {
    ADMIN: {
        canManageUsers: true,
        canManageSettings: true,
        canAccessAnalytics: true,
        canAccessPredictions: true,
        canAccessReports: true,
        canManageRoles: true,
    },
    ANALYST: {
        canManageUsers: false,
        canManageSettings: false,
        canAccessAnalytics: true,
        canAccessPredictions: true,
        canAccessReports: true,
        canManageRoles: false,
    },
    USER: {
        canManageUsers: false,
        canManageSettings: false,
        canAccessAnalytics: false,
        canAccessPredictions: false,
        canAccessReports: true,
        canManageRoles: false,
    },
}

export const ROLE_ROUTES = {
    ADMIN: '/dashboard/admin',
    ANALYST: '/dashboard/analyst',
    USER: '/dashboard/user',
}